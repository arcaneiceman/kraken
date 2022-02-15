package com.arcaneiceman.kraken.krakenserver.controller.io;

import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * Created by Wali on 4/1/2018.
 */
public class ActiveRequestIO {

    public static class Create {

        @Getter
        @NoArgsConstructor
        @AllArgsConstructor
        @ApiModel("ActiveRequest.Create.Request")
        public static class Request {

            @NotNull
            private String requestName;

            @NotNull
            private String requestType;

            @NotNull
            private Map<String, String> requestMetadata;

            @NotBlank
            private String valueToMatchInBase64;

            @NotNull
            private List<String> trackedLists;
        }
    }

    public static class GetJob {

        @Setter
        @Getter
        @NoArgsConstructor
        @AllArgsConstructor
        @ApiModel("ActiveRequest.GetJob.Request")
        public static class Request {

            @NotNull
            public String workerId;

            @NotNull
            @Min(value = 1, message = "The value must be positive")
            public Long multiplier;
        }

        @Getter
        @NoArgsConstructor
        @AllArgsConstructor
        @ApiModel("ActiveRequest.GetJob.Response")
        public static class Response {

            private String requestType;

            private Map<String, String> requestMetadata;

            private String valueToMatchInBase64;

            private String requestId;

            private String listId;

            private String jobId;

            private Long multiplier;

            private List<String> candidateValues;
        }

    }

    public static class ReportJob {

        @Getter
        @NoArgsConstructor
        @AllArgsConstructor
        @ApiModel("ActiveRequest.ReportJob.Request")
        public static class Request {

            @NotNull
            private String workerId;

            @NotNull
            private String requestId;

            @NotNull
            private String listId;

            @NotNull
            private String jobId;

            @NotNull
            private TrackingStatus trackingStatus;

            @NotNull
            private Map<String, String> results;
        }
    }

    public static class Summary {

        @Getter
        @Setter
        @NoArgsConstructor
        @AllArgsConstructor
        @ApiModel("ActiveRequest.Summary.Response")
        public static class Response {

            private int totalActiveRequests;

            private Long totalJobCount;

            private Long completeJobCount;

            private Long errorJobCount;
        }
    }

}
