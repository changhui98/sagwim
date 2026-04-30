package com.peopleground.sagwim.image.presentation.controller;

import com.peopleground.sagwim.image.application.service.ImageService;
import com.peopleground.sagwim.image.domain.entity.ImageTargetType;
import com.peopleground.sagwim.image.presentation.dto.response.ImageResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/images")
public class ImageController {

    private final ImageService imageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageResponse> uploadImage(
        @RequestParam("file") MultipartFile file,
        @RequestParam("targetType") ImageTargetType targetType,
        @RequestParam("targetId") String targetId
    ) {
        ImageResponse response = imageService.uploadImage(file, targetType, targetId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ImageResponse>> getImages(
        @RequestParam("targetType") ImageTargetType targetType,
        @RequestParam("targetId") String targetId
    ) {
        List<ImageResponse> response = imageService.getImages(targetType, targetId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long imageId) {
        imageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }
}
