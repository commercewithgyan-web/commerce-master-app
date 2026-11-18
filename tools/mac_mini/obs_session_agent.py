#!/usr/bin/env python3
"""Start/stop OBS recording from the Class_Sessions Live state.

Polls the Apps Script `liveSessionWebhook` every 5 s (same secret as the uploader) and drives OBS
through its WebSocket. Class+subject are put in the recording file name so youtube_upload.py's
detect() picks them up.

Secrets live ONLY in ~/Library/Application Support/CommerceGyan/ (never in git or chat):
  config.json     - webhook_url, webhook_secret (shared with the uploader)
  obs_config.json - {"host": "localhost", "port": 4455, "password": "<set on the Mac mini>"}
Setup: pip3 install obsws-python ; enable OBS > Tools > WebSocket Server Settings.
"""
import json, time, urllib.request
from datetime import datetime
from pathlib import Path

APP = Path.home() / "Library/Application Support/CommerceGyan"
POLL = 5
MAX_BACKOFF = 60


def decide(live_now, recording_now):
    """'start' | 'stop' | None."""
    if live_now and not recording_now:
        return 'start'
    if recording_now and not live_now:
        return 'stop'
    return None


def rec_name(cls, subject):
    return f"{cls}_{subject.strip().replace(' ', '-')}_{datetime.now():%Y-%m-%d_%H%M}"


def read_cfg(name):
    return json.loads((APP / name).read_text())


def fetch_live(cfg):
    req = urllib.request.Request(
        cfg["webhook_url"],
        data=json.dumps({"action": "liveSessionWebhook", "secret": cfg["webhook_secret"]}).encode(),
        headers={"Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=20) as r:
        body = json.loads(r.read().decode())
    if not body.get("ok"):
        raise RuntimeError(str(body.get("error"))[:120])
    return body["data"]


def main():
    import obsws_python as obs
    cfg, oc = read_cfg("config.json"), read_cfg("obs_config.json")
    client, delay = None, POLL
    while True:
        try:
            live = fetch_live(cfg)
            if client is None:
                client = obs.ReqClient(host=oc.get("host", "localhost"), port=oc.get("port", 4455),
                                       password=oc["password"], timeout=5)
            recording = client.get_record_status().output_active
            act = decide(bool(live.get("live")), recording)
            if act == 'start':
                client.set_profile_parameter("Output", "FilenameFormatting", rec_name(live["class"], live["subject"]))
                client.start_record()
                print("recording started", flush=True)
            elif act == 'stop':
                client.stop_record()
                print("recording stopped", flush=True)
            delay = POLL
        except Exception as e:  # network/OBS down: retry with backoff; session itself is unaffected
            print("agent error:", type(e).__name__, str(e)[:120], flush=True)
            client = None
            delay = min(delay * 2, MAX_BACKOFF)
        time.sleep(delay)


if __name__ == "__main__":
    main()
