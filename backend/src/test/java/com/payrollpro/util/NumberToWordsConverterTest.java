package com.payrollpro.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NumberToWordsConverterTest {

    @Test
    @DisplayName("Convert Zero Amount")
    void testZero() {
        assertEquals("Rupees Zero Only", NumberToWordsConverter.convertToIndianCurrency(BigDecimal.ZERO));
    }

    @Test
    @DisplayName("Convert Exact Thousands and Hundreds")
    void testThousandsAndHundreds() {
        assertEquals("Rupees Twenty-Five Thousand Only",
                NumberToWordsConverter.convertToIndianCurrency(new BigDecimal("25000")));

        assertEquals("Rupees One Thousand Two Hundred Thirty-Four Only",
                NumberToWordsConverter.convertToIndianCurrency(new BigDecimal("1234")));
    }

    @Test
    @DisplayName("Convert Lakhs and Crores")
    void testLakhsAndCrores() {
        assertEquals("Rupees One Lakh Only",
                NumberToWordsConverter.convertToIndianCurrency(new BigDecimal("100000")));

        assertEquals("Rupees Twelve Lakh Only",
                NumberToWordsConverter.convertToIndianCurrency(new BigDecimal("1200000")));

        assertEquals("Rupees One Crore Two Lakh Three Thousand Four Hundred Fifty-Six Only",
                NumberToWordsConverter.convertToIndianCurrency(new BigDecimal("10203456")));
    }

    @Test
    @DisplayName("Convert Rupees and Paise")
    void testRupeesAndPaise() {
        assertEquals("Rupees Twenty-Seven Thousand Two Hundred Sixteen and Sixty-Seven Paise Only",
                NumberToWordsConverter.convertToIndianCurrency(new BigDecimal("27216.67")));
    }
}
