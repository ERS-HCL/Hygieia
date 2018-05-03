package com.capitalone.dashboard.rest;

import com.capitalone.dashboard.misc.HygieiaException;
import com.capitalone.dashboard.model.BinaryArtifact;
import com.capitalone.dashboard.model.BinaryDefect;
import com.capitalone.dashboard.model.DataResponse;
import com.capitalone.dashboard.request.*;
import com.capitalone.dashboard.service.BinaryArtifactService;
import com.capitalone.dashboard.service.BinaryDefectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;
import static org.springframework.web.bind.annotation.RequestMethod.GET;
import static org.springframework.web.bind.annotation.RequestMethod.POST;

@RestController
public class BinaryDefectController {

    private final BinaryDefectService artifactService;

    @Autowired
    public BinaryDefectController(BinaryDefectService artifactService) {
        this.artifactService = artifactService;
    }

    @RequestMapping(value = "/defect", method = GET, produces = APPLICATION_JSON_VALUE)
    public DataResponse<Iterable<BinaryDefect>> search(@Valid BinaryDefectRequest request) {
        return artifactService.search(request);
    }

    @RequestMapping(value = "/defect", method = POST,
            consumes = APPLICATION_JSON_VALUE, produces = APPLICATION_JSON_VALUE)
    public ResponseEntity<String> create(@Valid @RequestBody BinaryDefectCreateRequest request) throws HygieiaException {
        String response = artifactService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
