package com.arcaneiceman.kraken.krakenserver.controller.io;

import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class CompleteRequestIO {

    public static class Summary {

        @Getter
        @Setter
        @NoArgsConstructor
        @AllArgsConstructor
        @ApiModel("CompleteRequest.Summary.Response")
        public static class Response {

            private int totalCompleteRequests;

            private int totalFoundRequests;
        }
    }
}
