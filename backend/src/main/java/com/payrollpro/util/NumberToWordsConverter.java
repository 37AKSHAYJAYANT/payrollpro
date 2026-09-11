package com.payrollpro.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class NumberToWordsConverter {

    private static final String[] ONES = {
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
            "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    };

    private static final String[] TENS = {
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    public static String convertToIndianCurrency(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return "Rupees Zero Only";
        }

        BigDecimal rounded = amount.setScale(2, RoundingMode.HALF_UP);
        long rupees = rounded.longValue();
        int paise = rounded.remainder(BigDecimal.ONE).multiply(new BigDecimal(100)).intValue();

        StringBuilder result = new StringBuilder("Rupees ");
        result.append(convertNumber(rupees));

        if (paise > 0) {
            result.append(" and ").append(convertNumber(paise)).append(" Paise");
        }

        result.append(" Only");
        return result.toString();
    }

    private static String convertNumber(long n) {
        if (n == 0) return "Zero";

        StringBuilder sb = new StringBuilder();

        if (n >= 10000000) { // Crores
            long crores = n / 10000000;
            sb.append(convertThreeDigits((int) crores)).append(" Crore ");
            n %= 10000000;
        }

        if (n >= 100000) { // Lakhs
            long lakhs = n / 100000;
            sb.append(convertThreeDigits((int) lakhs)).append(" Lakh ");
            n %= 100000;
        }

        if (n >= 1000) { // Thousands
            long thousands = n / 1000;
            sb.append(convertThreeDigits((int) thousands)).append(" Thousand ");
            n %= 1000;
        }

        if (n > 0) {
            sb.append(convertThreeDigits((int) n));
        }

        return sb.toString().trim();
    }

    private static String convertThreeDigits(int n) {
        StringBuilder sb = new StringBuilder();

        if (n >= 100) {
            sb.append(ONES[n / 100]).append(" Hundred ");
            n %= 100;
        }

        if (n > 0) {
            if (n < 20) {
                sb.append(ONES[n]);
            } else {
                sb.append(TENS[n / 10]);
                if (n % 10 > 0) {
                    sb.append("-").append(ONES[n % 10]);
                }
            }
        }

        return sb.toString().trim();
    }
}
