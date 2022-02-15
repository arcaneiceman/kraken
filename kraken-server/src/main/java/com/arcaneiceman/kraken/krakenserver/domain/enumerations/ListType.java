package com.arcaneiceman.kraken.krakenserver.domain.enumerations;

public enum ListType {

    PASSWORD_LIST(Constants.PASSWORD_LIST_VALUE),
    CRUNCH(Constants.CRUNCH_VALUE);

    ListType(String listType) {
    }

    public static class Constants {
        public static final String PASSWORD_LIST_VALUE = "PASSWORD_LIST";
        public static final String CRUNCH_VALUE = "CRUNCH";
    }
}
