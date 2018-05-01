package com.capitalone.dashboard.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Collector implementation for XLDeploy that stores Defect server URLs.
 */
public class DefectCollector extends Collector {
    private List<String> defectServers = new ArrayList<>();

    public List<String> getDefectServers() {
        return defectServers;
    }

    public static DefectCollector prototype(List<String> servers) {
    	DefectCollector protoType = new DefectCollector();
        protoType.setName("Defect");
        protoType.setCollectorType(CollectorType.TDP);
        protoType.setOnline(true);
        protoType.setEnabled(true);
        protoType.getDefectServers().addAll(servers);
        Map<String, Object> options = new HashMap<>();
        options.put("QueryURL","");
        options.put("QueryName","");
        protoType.setAllFields(options);
        protoType.setUniqueFields(options);
        return protoType;
    }
}
