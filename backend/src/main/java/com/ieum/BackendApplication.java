package com.ieum;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        // 엔티티의 LocalDateTime.now()가 서버(JVM) 시간대를 따르므로, 배포 서버가 UTC여도 서울 시각이 저장되게 고정한다(#80)
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
        SpringApplication.run(BackendApplication.class, args);
    }

}
