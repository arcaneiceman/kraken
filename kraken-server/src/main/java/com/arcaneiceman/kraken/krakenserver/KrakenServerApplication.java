package com.arcaneiceman.kraken.krakenserver;

import de.codecentric.boot.admin.server.config.EnableAdminServer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@EnableAdminServer
@SpringBootApplication
public class KrakenServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(KrakenServerApplication.class, args);
    }
}
