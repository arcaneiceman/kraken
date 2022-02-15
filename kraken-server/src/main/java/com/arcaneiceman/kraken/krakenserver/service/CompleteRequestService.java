package com.arcaneiceman.kraken.krakenserver.service;

import com.arcaneiceman.kraken.krakenserver.controller.io.CompleteRequestIO;
import com.arcaneiceman.kraken.krakenserver.domain.CompleteRequest;
import com.arcaneiceman.kraken.krakenserver.domain.abs.TrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.embeddedable.CompleteTrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import com.arcaneiceman.kraken.krakenserver.repository.CompleteRequestRepository;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import static org.zalando.problem.Status.NOT_FOUND;

@Service
@Transactional
public class CompleteRequestService {

    private CompleteRequestRepository completeRequestRepository;
    private UserService userService;

    public CompleteRequestService(CompleteRequestRepository completeRequestRepository,
                                  UserService userService) {
        this.completeRequestRepository = completeRequestRepository;
        this.userService = userService;
    }

    public CompleteRequest create(String requestType,
                                  String requestName,
                                  String requestMetadata,
                                  Integer targetCount,
                                  List<TrackedList> trackedLists,
                                  String results,
                                  TrackingStatus status) {
        return completeRequestRepository.save(new CompleteRequest(null, requestType, requestName, requestMetadata,
                targetCount, trackedLists.stream().map(CompleteTrackedList::new).collect(Collectors.toList()),
                results, status, userService.getUserOrThrow()));
    }

    public Page<CompleteRequest> list(Pageable pageable) {
        return completeRequestRepository.findByOwner(pageable, userService.getUserOrThrow());
    }

    public CompleteRequest get(String id) {
        return completeRequestRepository.findByIdAndOwner(id, userService.getUserOrThrow())
                .orElseThrow(() -> new SystemException(432, "Complete Request with id " + id + " not found", NOT_FOUND));
    }

    public void delete(String id) {
        CompleteRequest completeRequest = completeRequestRepository.findByIdAndOwner(id, userService.getUserOrThrow())
                .orElseThrow(() -> new SystemException(432, "Complete Request with id " + id + " not found", NOT_FOUND));
        completeRequestRepository.delete(completeRequest);
    }

    public CompleteRequestIO.Summary.Response summary() {
        return new CompleteRequestIO.Summary.Response(
                completeRequestRepository.findByOwner(userService.getUserOrThrow()).size(),
                completeRequestRepository.findByOwnerAndResultsNot(userService.getUserOrThrow(), "{}").size());
    }

}
