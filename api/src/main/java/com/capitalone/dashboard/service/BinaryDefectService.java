package com.capitalone.dashboard.service;

import com.capitalone.dashboard.misc.HygieiaException;
import com.capitalone.dashboard.model.BinaryDefect;
import com.capitalone.dashboard.model.DataResponse;
import com.capitalone.dashboard.request.*;

public interface BinaryDefectService {

    /**
     * Finds all of the Builds matching the specified request criteria.
     *
     * @param request search criteria
     * @return builds matching criteria
     */
    DataResponse<Iterable<BinaryDefect>> search(BinaryDefectRequest request);

    String create(BinaryDefectCreateRequest request) throws HygieiaException;
}
