package com.peopleground.sagwim.global.dto;

import java.util.List;

public record MonthlyStatsResponse(String timezone, List<MonthlyStatsPoint> points) {
}
