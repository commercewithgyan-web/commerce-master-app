#!/usr/bin/env python3
"""Upload compressed OBS recordings to YouTube (Unlisted) and report the link.

Watches ~/Movies/Ready_For_YouTube (output of the existing compressor), uploads each
finished .mp4 as Unlisted, then moves it to ~/Movies/Uploaded.

Secrets (never in this file or in git), all under ~/Library/Application Support/CommerceGyan/:
  client_secret.json  - OAuth client downloaded from Google Cloud (YouTube Data API v3)
  token.json          - refresh token, created on the first run (browser consent by the owner)
  config.json         - {"webhook_url": "...", "webhook_secret": "...", "class": "12", "subject": "Accountancy"}
The link is POSTed to webhook_url. That Apps Script endpoint is NOT built yet; until it is,
the link is only appended to ~/Movies/Uploaded/links.txt.

Setup: pip3 install google-api-python-client google-auth-oauthlib
Run:   python3 youtube_upload.py            (loops every 60 s)
"""
import json, shutil, time, urllib.request
from datetime import date
from pathlib import Path

HOME = Path.home()
APP = HOME / "Library/Application Support/CommerceGyan"
READY = HOME / "Movies/Ready_For_YouTube"
DONE = HOME / "Movies/Uploaded"
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def youtube():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    tok = APP / "token.json"
    creds = Credentials.from_authorized_user_file(str(tok), SCOPES) if tok.exists() else None
    if not creds or not creds.valid:
        if creds and creds.refresh_token:
            creds.refresh(Request())
        else:
            creds = InstalledAppFlow.from_client_secrets_file(str(APP / "client_secret.json"), SCOPES).run_local_server(port=0)
        tok.write_text(creds.to_json())
        tok.chmod(0o600)
    return build("youtube", "v3", credentials=creds)


def upload(yt, path):
    from googleapiclient.http import MediaFileUpload
    body = {"snippet": {"title": f"Class {date.today():%d-%m-%Y} - {path.stem}", "categoryId": "27"},
            "status": {"privacyStatus": "unlisted", "selfDeclaredMadeForKids": False}}
    req = yt.videos().insert(part="snippet,status", body=body,
                             media_body=MediaFileUpload(str(path), chunksize=8 * 1024 * 1024, resumable=True))
    resp = None
    while resp is None:
        _, resp = req.next_chunk()
    return "https://youtu.be/" + resp["id"]


def report(url):
    DONE.mkdir(parents=True, exist_ok=True)
    with open(DONE / "links.txt", "a") as f:
        f.write(f"{date.today()} {url}\n")
    cfg_p = APP / "config.json"
    if not cfg_p.exists():
        return
    cfg = json.loads(cfg_p.read_text())
    if not cfg.get("webhook_url"):
        return
    data = json.dumps({"action": "recordingWebhook", "secret": cfg.get("webhook_secret"), "classLevel": cfg.get("class"),
                       "subject": cfg.get("subject"), "youtubeUrl": url}).encode()
    urllib.request.urlopen(urllib.request.Request(cfg["webhook_url"], data, {"Content-Type": "application/json"}), timeout=30)


def stable(p):
    s1 = p.stat().st_size; time.sleep(5)
    return s1 == p.stat().st_size and s1 > 0


def main():
    yt = youtube()
    DONE.mkdir(parents=True, exist_ok=True)
    while True:
        for p in sorted(READY.glob("*.mp4")):
            if not stable(p):
                continue
            try:
                url = upload(yt, p)
                report(url)
                shutil.move(str(p), str(DONE / p.name))
                print("uploaded", p.name, url, flush=True)
            except Exception as e:
                print("FAILED", p.name, e, flush=True)
        time.sleep(60)


if __name__ == "__main__":
    main()
