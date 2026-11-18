import unittest
from obs_session_agent import decide, rec_name


class Decide(unittest.TestCase):
    def test_four_combinations(self):
        self.assertEqual(decide(True, False), 'start')
        self.assertEqual(decide(False, True), 'stop')
        self.assertIsNone(decide(True, True))
        self.assertIsNone(decide(False, False))

    def test_filename_has_class_and_subject(self):
        n = rec_name('12', 'Business Studies')
        self.assertTrue(n.startswith('12_Business-Studies_'), n)


if __name__ == '__main__':
    unittest.main()
