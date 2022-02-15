package com.arcaneiceman.kraken.krakenserver.controller.io;

import com.arcaneiceman.kraken.krakenserver.domain.enumerations.WorkerType;
import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class WorkerIO {

    public static class Heartbeat {

        @Getter
        @NoArgsConstructor
        @AllArgsConstructor
        @ApiModel("Worker.Heartbeat.Request")
        public static class Request {

            @NotNull
            String id;
        }
    }

    public static class Create {

        @Getter
        @NoArgsConstructor
        @AllArgsConstructor
        @ApiModel("Worker.Create.Request")
        public static class Request {

            @NotNull
            @NotBlank
            private String workerName;

            @NotNull
            private WorkerType workerType;

            private String platform;
        }
    }

    public static class Summary {

        @Getter
        @Setter
        @NoArgsConstructor
        @AllArgsConstructor
        @ApiModel("Worker.Summary.Response")
        public static class Response {

            private int totalActiveWorkers;

            private int totalOnlineWorkers;

            private int totalOfflineWorkers;

            private long jobsInQueue;
        }
    }
}
