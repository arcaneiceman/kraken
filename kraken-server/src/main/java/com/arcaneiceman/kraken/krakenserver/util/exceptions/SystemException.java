package com.arcaneiceman.kraken.krakenserver.util.exceptions;

import lombok.Getter;
import org.zalando.problem.AbstractThrowableProblem;
import org.zalando.problem.Status;

/**
 * Created by wali on 16/10/17.
 */
@Getter
public class SystemException extends AbstractThrowableProblem {

    private int errorCode;

    public SystemException(int errorCode, String message, Status httpStatus) {
        super(null, message, httpStatus, null, null, null);
        this.errorCode = errorCode;
    }

}
