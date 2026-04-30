package com.peopleground.sagwim.user.presentation.dto.request;

import java.util.List;

public record GeocodeResponse(
    String status,
    List<Result> results
) {

    public record Result(
        Geometry geometry
    ){}

    public record Geometry(
        Location location
    ){}

    public record Location(
        double lat,
        double lng
    ){}
}
