package com.capitalone.dashboard.service;

import com.capitalone.dashboard.misc.HygieiaException;
import com.capitalone.dashboard.model.*;
import com.capitalone.dashboard.repository.*;
import com.capitalone.dashboard.request.*;
import com.google.common.base.Objects;
import com.google.common.collect.Iterables;
import com.mysema.query.BooleanBuilder;
import org.apache.commons.lang.StringUtils;
import org.joda.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;


import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BinaryDefectServiceImpl implements BinaryDefectService {

    private final BinaryDefectRepository artifactRepository;
	private final ComponentRepository componentRepository;
	private final CollectorRepository collectorRepository;
	private final CollectorService collectorService;

    @Autowired
    public BinaryDefectServiceImpl(BinaryDefectRepository artifactRepository,ComponentRepository componentRepository,
								   CollectorRepository collectorRepository,
								   CollectorService collectorService) {
        this.artifactRepository = artifactRepository;
		this.componentRepository = componentRepository;
		this.collectorRepository = collectorRepository;
		this.collectorService = collectorService;
    }


	@Override
	public DataResponse<Iterable<BinaryDefect>> search(BinaryDefectRequest request) {
		if (request == null) {
			return emptyResponse();
		}

		if (request.getComponentId() == null) {
			return emptyResponse();
		}


		return searchType(request);
	}

	protected DataResponse<Iterable<BinaryDefect>> emptyResponse() {
		return new DataResponse<>(null, System.currentTimeMillis());
	}

	protected CollectorItem getCollectorItem(BinaryDefectRequest request) {
		CollectorItem item = null;
		Component component = componentRepository.findOne(request.getComponentId());
		String type= Objects.firstNonNull(request.getType(),"TDP");
		List<CollectorItem> items = component.getCollectorItems().get(CollectorType.TDP);
		if (items != null) {
			item = Iterables.getFirst(items, null);
		}
		return item;
	}


	public DataResponse<Iterable<BinaryDefect>> searchType(BinaryDefectRequest request) {
		CollectorItem item = getCollectorItem(request);
		if (item == null) {
			return emptyResponse();
		}

		QBinaryDefect binaryDefect = new QBinaryDefect("defect");
		BooleanBuilder builder = new BooleanBuilder();

		builder.and(binaryDefect.collectorItemId.eq(item.getId()));

		if (request.getNumberOfDays() != null) {
			long endTimeTarget =
					new LocalDate().minusDays(request.getNumberOfDays()).toDate().getTime();
			builder.and(binaryDefect.timestamp.goe(endTimeTarget));
		} else if (request.validDateRange()) {
			builder.and(binaryDefect.timestamp.between(request.getDateBegins(), request.getDateEnds()));
		}
		Iterable<BinaryDefect> result;
		if (request.getMax() == null) {
			result = artifactRepository.findAll(builder.getValue(), binaryDefect.timestamp.desc());
		} else {
			PageRequest pageRequest =
					new PageRequest(0, request.getMax(), Sort.Direction.DESC, "timestamp");
			result = artifactRepository.findAll(builder.getValue(), pageRequest).getContent();
		}

		String queryURL = (String)item.getOptions().get("queryURL");
		String queryName = (String) item.getOptions().get("queryName");
		Collector collector = collectorRepository.findOne(item.getCollectorId());
		long lastExecuted = (collector == null) ? 0 : collector.getLastExecuted();
		return new DataResponse<Iterable<BinaryDefect>>(result, lastExecuted,queryURL);
	}

    @Override
    public String create(BinaryDefectCreateRequest request) throws HygieiaException  {
		BinaryDefect ba = new BinaryDefect();

		/**
		 * Step 1: create Collector if not there
		 * Step 2: create Collector item if not there
		 * Step 3: Insert Defect data if new. If existing, update it.
		 */
		Collector collector = createCollector();

		if (collector == null) {
			throw new HygieiaException("Failed creating SDP Defect collector.", HygieiaException.COLLECTOR_CREATE_ERROR);
		}

		CollectorItem collectorItem = createCollectorItem(collector, request);

		if (collectorItem == null) {
			throw new HygieiaException("Failed creating SDP Defect  collector item.", HygieiaException.COLLECTOR_ITEM_CREATE_ERROR);
		}

		BinaryDefect tdpDefect = createTDPDefect(collectorItem, request);

		if (tdpDefect == null) {
			throw new HygieiaException("Failed inserting/updating SDP Defect information.", HygieiaException.ERROR_INSERTING_DATA);
		}

		return tdpDefect.getId().toString();

	}

	private CollectorItem createCollectorItem(Collector collector, BinaryDefectCreateRequest request) throws HygieiaException {
		CollectorItem tempCi = new CollectorItem();
		tempCi.setCollectorId(collector.getId());
		tempCi.setDescription(request.getQueryName());
		tempCi.setPushed(true);
		tempCi.setLastUpdated(System.currentTimeMillis());

		Map<String, Object> option = new HashMap<>();
		option.put("queryName", request.getQueryName());
		option.put("queryURL", request.getQueryURL());
		option.put("userName", request.getUserName());
		option.put("password", request.getPassword());
		tempCi.getOptions().putAll(option);

		if (StringUtils.isEmpty(tempCi.getNiceName())) {
			return collectorService.createCollectorItem(tempCi);
		}
		return collectorService.createCollectorItemByNiceNameAndProjectId(tempCi, request.getQueryURL());
	}

	private Collector createCollector() {
		CollectorRequest collectorReq = new CollectorRequest();
		collectorReq.setName("Defect");  //for now hardcode it.
		collectorReq.setCollectorType(CollectorType.TDP);
		Collector col = collectorReq.toCollector();
		col.setEnabled(true);
		col.setOnline(true);
		col.setLastExecuted(System.currentTimeMillis());
		return collectorService.createCollector(col);
	}


	private BinaryDefect createTDPDefect(CollectorItem collectorItem, BinaryDefectCreateRequest request) {
		BinaryDefect tdpDefect = artifactRepository.findByCollectorItemIdAndTimestamp(
				collectorItem.getId(), request.getTimestamp());
		if (tdpDefect == null) {
			tdpDefect = new BinaryDefect();
		}
		tdpDefect.setCollectorItemId(collectorItem.getId());
		tdpDefect.setQueryName(request.getQueryName());
		tdpDefect.setQueryURL(request.getQueryURL());
		tdpDefect.setUsername(request.getUserName());
		tdpDefect.setSecretKey(request.getPassword());
		tdpDefect.setTimestamp(System.currentTimeMillis());
		return artifactRepository.save(tdpDefect); // Save = Update (if ID present) or Insert (if ID not there)
	}
    
}
