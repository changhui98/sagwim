package com.peopleground.sagwim;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SagwimApplication {

	public static void main(String[] args) {
		SpringApplication.run(SagwimApplication.class, args);
	}

	/**
	 * 한국 사용자 대상 서비스이므로 JVM 전역 시간 기준을 Asia/Seoul 로 고정한다.
	 * Clock.systemDefaultZone(), LocalDateTime.now(), Jackson 의 Date 직렬화,
	 * 로그 패턴의 %d 등 "현재 시각" 을 사용하는 모든 코드가 KST 로 동작하게 된다.
	 *
	 * 컨테이너/호스트의 TZ 환경변수와 무관하게 동작을 보장하기 위해 코드에서 명시적으로 설정한다.
	 */
	@PostConstruct
	public void setDefaultTimeZone() {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
	}

}
