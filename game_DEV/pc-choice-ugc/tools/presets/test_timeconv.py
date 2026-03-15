import unittest

from timeconv import kst_to_utc_hhmm, utc_to_kst_hhmm, utc_to_kst_minutes


class TimeConversionTests(unittest.TestCase):
    def test_case_20_00_utc_to_05_00_kst(self):
        self.assertEqual(utc_to_kst_hhmm("20:00"), "05:00")

    def test_case_15_00_utc_to_00_00_kst(self):
        self.assertEqual(utc_to_kst_hhmm("15:00"), "00:00")

    def test_case_07_00_utc_to_16_00_kst(self):
        self.assertEqual(utc_to_kst_hhmm("07:00"), "16:00")

    def test_case_23_30_utc_to_08_30_kst(self):
        self.assertEqual(utc_to_kst_hhmm("23:30"), "08:30")

    def test_case_00_00_utc_to_09_00_kst(self):
        self.assertEqual(utc_to_kst_hhmm("00:00"), "09:00")

    def test_case_12_00_59_utc_to_21_00_kst(self):
        self.assertEqual(utc_to_kst_hhmm("12:00:59"), "21:00")

    def test_case_14_59_utc_to_23_59_kst(self):
        self.assertEqual(utc_to_kst_hhmm("14:59"), "23:59")

    def test_case_15_01_utc_to_00_01_kst(self):
        self.assertEqual(utc_to_kst_hhmm("15:01"), "00:01")

    def test_case_03_15_utc_to_12_15_kst(self):
        self.assertEqual(utc_to_kst_hhmm("03:15"), "12:15")

    def test_case_18_45_utc_to_03_45_kst(self):
        self.assertEqual(utc_to_kst_hhmm("18:45"), "03:45")

    def test_minutes_range_00_00(self):
        self.assertEqual(utc_to_kst_minutes("00:00"), 540)

    def test_minutes_range_15_00(self):
        self.assertEqual(utc_to_kst_minutes("15:00"), 0)

    def test_minutes_range_23_59(self):
        self.assertEqual(utc_to_kst_minutes("23:59"), 539)

    def test_kst_to_utc_inverse_05_00(self):
        self.assertEqual(kst_to_utc_hhmm("05:00"), "20:00")

    def test_kst_to_utc_inverse_00_00(self):
        self.assertEqual(kst_to_utc_hhmm("00:00"), "15:00")

    def test_kst_to_utc_inverse_16_00(self):
        self.assertEqual(kst_to_utc_hhmm("16:00"), "07:00")


if __name__ == "__main__":
    unittest.main()
