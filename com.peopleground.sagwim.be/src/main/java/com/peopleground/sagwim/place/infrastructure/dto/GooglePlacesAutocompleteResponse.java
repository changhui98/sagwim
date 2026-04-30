package com.peopleground.sagwim.place.infrastructure.dto;

import java.util.List;

/**
 * Google Places API (New) - Autocomplete 응답 DTO
 * POST https://places.googleapis.com/v1/places:autocomplete
 */
public record GooglePlacesAutocompleteResponse(
    List<Suggestion> suggestions
) {

    public record Suggestion(
        PlacePrediction placePrediction
    ) {
    }

    public record PlacePrediction(
        String placeId,
        Text text,
        StructuredFormat structuredFormat
    ) {
    }

    public record Text(
        String text
    ) {
    }

    public record StructuredFormat(
        Text mainText,
        Text secondaryText
    ) {
    }
}
