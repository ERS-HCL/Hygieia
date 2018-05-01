package com.capitalone.dashboard.collector;

import static org.hamcrest.Matchers.is;
import static org.junit.Assert.assertThat;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.io.InputStream;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.apache.commons.io.IOUtils;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Matchers;
import org.mockito.Mock;
import org.mockito.runners.MockitoJUnitRunner;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestOperations;

import com.capitalone.dashboard.model.DefectRepo;
import com.capitalone.dashboard.model.BinaryDefect;
import com.capitalone.dashboard.util.DefectUtilTest;
import com.capitalone.dashboard.util.Supplier;

@RunWith(MockitoJUnitRunner.class)
public class DefaultDefectClientTest {
	@Mock private Supplier<RestOperations> restOperationsSupplier;
    @Mock private RestOperations rest;
    @Mock private DefectSettings settings;
    
    private final DateFormat FULL_DATE = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX");
    
    private DefaultDefectClient defaultDefectClient;
    
    @Before
    public void init() {
    	when(restOperationsSupplier.get()).thenReturn(rest);
        settings = new DefectSettings();
        settings.setServers(Collections.singletonList("http://localhost:8081/defect/"));
        defaultDefectClient = new DefaultDefectClient(settings, restOperationsSupplier);
    }
    
    @Test
    public void testGetRepos() throws Exception {
    	String reposJson = getJson("repos.json");
    	
    	String instanceUrl = "http://localhost:8081/defect/";
    	String reposListUrl = "http://localhost:8081/defect/api/repositories";
    	
    	when(rest.exchange(eq(reposListUrl), eq(HttpMethod.GET), Matchers.any(HttpEntity.class), eq(String.class)))
    		.thenReturn(new ResponseEntity<>(reposJson, HttpStatus.OK));
    }
    
    @Test
    public void testGetEmptyDefects() throws Exception {
    	String emptyDefectsJson = getJson("emptyDefects.json");
    	
    	String instanceUrl = "http://localhost:8081/defect/";
    	String aqlUrl = "http://localhost:8081/defect/api/search/aql";
    	String repoName = "release";
    	
    	when(rest.exchange(eq(aqlUrl), eq(HttpMethod.POST), Matchers.any(HttpEntity.class), eq(String.class)))
    		.thenReturn(new ResponseEntity<>(emptyDefectsJson, HttpStatus.OK));
    	List<BinaryDefect> artifacts = defaultDefectClient.getDefects(instanceUrl, repoName, 0);
    	assertThat(artifacts.size(), is(0));
    }
    
    @Test
    public void testGetMavenDefects() throws Exception {
    	String mavenDefectsJson = getJson("mavenDefects.json");
    	
    	String instanceUrl = "http://localhost:8081/defect/";
    	String aqlUrl = "http://localhost:8081/defect/api/search/aql";
    	String repoName = "release";
    	
    	when(rest.exchange(eq(aqlUrl), eq(HttpMethod.POST), Matchers.any(HttpEntity.class), eq(String.class)))
    		.thenReturn(new ResponseEntity<>(mavenDefectsJson, HttpStatus.OK));
    	List<BinaryDefect> artifacts = defaultDefectClient.getDefects(instanceUrl, repoName, 0);
    	assertThat(artifacts.size(), is(1));

    }
    
    @Test
    public void testGetIvyDefects() throws Exception {
    	String ivyDefectsJson = getJson("ivyDefects.json");
    	
    	String instanceUrl = "http://localhost:8081/defect/";
    	String aqlUrl = "http://localhost:8081/defect/api/search/aql";
    	String repoName = "release";
    	
    	when(rest.exchange(eq(aqlUrl), eq(HttpMethod.POST), Matchers.any(HttpEntity.class), eq(String.class)))
    		.thenReturn(new ResponseEntity<>(ivyDefectsJson, HttpStatus.OK));
    	List<BinaryDefect> artifacts = defaultDefectClient.getDefects(instanceUrl, repoName, 0);
    	assertThat(artifacts.size(), is(2));
    	

    	assertThat(artifacts.get(1).getTimestamp(), is(FULL_DATE.parse("2016-10-13T05:10:49.209-04:00").getTime()));
    }
    
    private String getJson(String fileName) throws IOException {
        InputStream inputStream = DefaultDefectClient.class.getResourceAsStream(fileName);
        return IOUtils.toString(inputStream);
    }
}
