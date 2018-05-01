package com.capitalone.dashboard.collector;

import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

import com.capitalone.dashboard.model.CodeQualityMetricStatus;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestOperations;

import com.capitalone.dashboard.model.DefectRepo;
import com.capitalone.dashboard.model.BinaryDefect;
import com.capitalone.dashboard.util.DefectUtil;
import com.capitalone.dashboard.util.Supplier;

@Component
public class DefaultDefectClient implements DefectClient {
	private static final Logger LOG = LoggerFactory.getLogger(DefaultDefectClient.class);
	
	private static final String AQL_URL_SUFFIX = "api/search/aql";
	
	private final DateFormat FULL_DATE = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX");
	
	private final DefectSettings defectSettings;
	private final RestOperations rest;



	private static final String DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ssZ";
	private static final String ID = "id";
	private static final String NAME = "name";
	private static final String KEY = "key";
	private static final String VERSION = "version";
	private static final String MSR = "msr";
	private static final String ALERT = "alert";
	private static final String ALERT_TEXT = "alert_text";
	private static final String VALUE = "val";
	private static final String FORMATTED_VALUE = "frmt_val";
	private static final String STATUS_WARN = "WARN";
	private static final String STATUS_ALERT = "ALERT";
	private static final String DATE = "date";
	private MultiValueMap<String, String> map= new LinkedMultiValueMap<String, String>();
	private String ssoURL="";
	private String successURL="";
	private String loginInitURL="";

	private  HttpEntity<String> httpHeaders;
	private String sessionInitURL="";
	private String sessionAuthURL="";

	
	@Autowired
	public DefaultDefectClient(DefectSettings defectSettings, Supplier<RestOperations> restOperationsSupplier) {
        this.defectSettings = defectSettings;
        this.rest = restOperationsSupplier.get();


	}

	public List<BinaryDefect> getDefects(String instanceUrl, String repoName, long lastUpdated) {
		List<BinaryDefect> result = new ArrayList<>();
		

		return result;
	}



	private JSONArray parseAsArray(String url) throws ParseException {
		ResponseEntity<String> response = rest.exchange(url, HttpMethod.GET, this.httpHeaders, String.class);
		return (JSONArray) new JSONParser().parse(response.getBody());
	}

	private JSONArray parseAsArray(String url, String key) throws ParseException {
		ResponseEntity<String> response = rest.exchange(url, HttpMethod.GET, this.httpHeaders, String.class);
		JSONParser jsonParser = new JSONParser();
		JSONObject jsonObject = (JSONObject) jsonParser.parse(response.getBody());
		LOG.info(" result body : " + jsonObject.toJSONString());
		LOG.debug(url);
		return (JSONArray) jsonObject.get(key);
	}

	private long timestamp(JSONObject json, String key) {
		Object obj = json.get(key);
		if (obj != null) {
			try {
				return new SimpleDateFormat(DATE_FORMAT).parse(obj.toString()).getTime();
			} catch (java.text.ParseException e) {
				LOG.error(obj + " is not in expected format " + DATE_FORMAT, e);
			}
		}
		return 0;
	}

	private String str(JSONObject json, String key) {
		Object obj = json.get(key);
		return obj == null ? null : obj.toString();
	}
	@SuppressWarnings("unused")
	private Integer integer(JSONObject json, String key) {
		Object obj = json.get(key);
		return obj == null ? null : (Integer) obj;
	}

	@SuppressWarnings("unused")
	private BigDecimal decimal(JSONObject json, String key) {
		Object obj = json.get(key);
		return obj == null ? null : new BigDecimal(obj.toString());
	}

	@SuppressWarnings("unused")
	private Boolean bool(JSONObject json, String key) {
		Object obj = json.get(key);
		return obj == null ? null : Boolean.valueOf(obj.toString());
	}

	private CodeQualityMetricStatus metricStatus(String status) {
		if (StringUtils.isBlank(status)) {
			return CodeQualityMetricStatus.Ok;
		}

		switch(status) {
			case STATUS_WARN:  return CodeQualityMetricStatus.Warning;
			case STATUS_ALERT: return CodeQualityMetricStatus.Alert;
			default:           return CodeQualityMetricStatus.Ok;
		}
	}

	private HttpHeaders createHeaders(String username, String password){
		HttpHeaders headers = new HttpHeaders();
		if (username != null && !username.isEmpty() &&
				password != null && !password.isEmpty()) {
			String auth = username + ":" + password;
			byte[] encodedAuth = Base64.encodeBase64(
					auth.getBytes(Charset.forName("US-ASCII"))
			);
			String authHeader = "Basic " + new String(encodedAuth);
			headers.set("Authorization", authHeader);
		}
		return headers;
	}
}
