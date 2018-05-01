package com.capitalone.dashboard.collector;

import java.util.List;

import com.capitalone.dashboard.model.DefectRepo;
import com.capitalone.dashboard.model.BinaryDefect;

/**
 * Client for fetching artifacts information from Defect
 */
public interface DefectClient {
	

	
	/**
	 * Obtain all the artifacts in the given defect repo
	 * 
	 * @param instanceUrl		server url
	 * @param repoName			repo name
	 * @param lastUpdated		timestamp when the repo was last updated
	 * @return
	 */
	List<BinaryDefect> getDefects(String instanceUrl, String repoName, long lastUpdated);

}
