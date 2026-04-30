package com.peopleground.sagwim.user.infrastructure;

import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.presentation.dto.request.GeocodeResponse;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class GoogleGeocodingClient implements GeocodingClient {

    @Value("${google.maps.api-key}")
    private String apiKey;

    private final WebClient webClient = WebClient.create(
        "https://maps.googleapis.com"
    );

    @Override
    public GeoPoint convert(String address) {

        GeocodeResponse response = webClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/maps/api/geocode/json")
                .queryParam("address", address)
                .queryParam("key", apiKey)
                .build())
            .retrieve()
            .bodyToMono(GeocodeResponse.class)
            .block();

        if (response == null) {
            throw new AppException(ApiErrorCode.EXTERNAL_API_ERROR);
        }

        if (!"OK".equals(response.status())) {
            throw new AppException(ApiErrorCode.ADDRESS_CONVERT_FAILED);
        }

        if (response.results() == null || response.results().isEmpty()) {
            throw new AppException(ApiErrorCode.ADDRESS_CONVERT_FAILED);
        }

        double lat = response.results().get(0).geometry().location().lat();
        double lng = response.results().get(0).geometry().location().lng();

        return new GeoPoint(lat, lng);
    }
}
