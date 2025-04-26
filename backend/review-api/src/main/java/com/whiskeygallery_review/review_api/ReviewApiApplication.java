package com.whiskeygallery_review.review_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
@SpringBootApplication
public class ReviewApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReviewApiApplication.class, args);
	}

}
