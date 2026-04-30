package com.peopleground.sagwim.place.presentation.dto.response;

public record PlaceSuggestionResponse(
    String placeId,
    String primaryText,
    String secondaryText,
    String fullAddress
) {
}
