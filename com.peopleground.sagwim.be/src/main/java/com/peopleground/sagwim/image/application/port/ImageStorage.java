package com.peopleground.sagwim.image.application.port;

import org.springframework.web.multipart.MultipartFile;

public interface ImageStorage {

    String store(MultipartFile file, String storedFilename);

    void delete(String storedFilename);
}
