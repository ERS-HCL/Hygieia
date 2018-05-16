package com.capitalone.dashboard.collector;


import java.io.File;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.concurrent.TimeUnit;

import com.capitalone.dashboard.DefectConstant;
import com.capitalone.dashboard.model.*;
import com.capitalone.dashboard.repository.*;
import com.fasterxml.jackson.databind.MappingIterator;
import com.fasterxml.jackson.dataformat.csv.CsvMapper;
import com.fasterxml.jackson.dataformat.csv.CsvSchema;
import org.bson.types.ObjectId;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import com.google.common.collect.Iterables;

@Component
public class DefectCollectorTask extends CollectorTask<DefectCollector>{
	private static final Logger LOGGER = LoggerFactory.getLogger(DefectCollectorTask.class);

	private final DefectCollectorRepository defectCollectorRepository;
	private final DefectRepoRepository defectRepoRepository;
	private final DefectClient defectClient;
	private final DefectSettings defectSettings;
	private final BinaryDefectRepository binaryDefectRepository;
	private final ComponentRepository dbComponentRepository;
	private WebDriver driver;

	@Autowired
	public DefectCollectorTask(TaskScheduler taskScheduler,
							   DefectCollectorRepository defectCollectorRepository,
							   BinaryDefectRepository binaryDefectRepository,
							   DefectRepoRepository defectRepoRepository,
							   DefectClient defectClient,
							   ComponentRepository dbComponentRepository,
							   DefectSettings defectSettings) {
		super(taskScheduler, "Defect");
		this.defectCollectorRepository = defectCollectorRepository;
		this.binaryDefectRepository = binaryDefectRepository;
		this.defectClient = defectClient;
		this.defectSettings = defectSettings;
		this.defectRepoRepository = defectRepoRepository;
		this.dbComponentRepository = dbComponentRepository;
		driver = getChromeDriver();
	}

	@Override
	public DefectCollector getCollector() {
		return DefectCollector.prototype(defectSettings.getServers());
	}

	@Override
	public BaseCollectorRepository<DefectCollector> getCollectorRepository() {
		return defectCollectorRepository;
	}

	@Override
	public String getCron() {
		return defectSettings.getCron();
	}

	@Override
	public void collect(DefectCollector collector) {
		Set<ObjectId> udId = new HashSet<>();
		udId.add(collector.getId());
		long start = System.currentTimeMillis();

		List<DefectRepo> existingTDPs =  defectRepoRepository.findByCollectorIdIn(udId);
		List<DefectRepo> latestTDPs = new ArrayList<DefectRepo>();
		clean(collector, existingTDPs);
		log("Fetched TDP Queries   " + existingTDPs.size(), start);
		refreshData(existingTDPs, defectClient);
		writeDefectsToDB(existingTDPs);


		//	;
		//    addNewProjects(projects, existingProjects, collector);
		//	refreshData(enabledProjects(collector, instanceUrl), sonarClient,metrics,instanceUrl);


		log("Finished", start);
		//	deleteUnwantedJobs(latestTDPs, existingTDPs, collector);



	}




	private void deleteUnwantedJobs(List<DefectRepo> latestProjects, List<DefectRepo> existingProjects, DefectCollector collector) {
		List<DefectRepo> deleteJobList = new ArrayList<>();

		// First delete collector items that are not supposed to be collected anymore because the servers have moved(?)
		for (DefectRepo job : existingProjects) {
			if (job.isPushed()) continue; // do not delete jobs that are being pushed via API
			if ( (!job.getCollectorId().equals(collector.getId())) ||
					(!latestProjects.contains(job))) {
				deleteJobList.add(job);
			}
		}
		if (!org.apache.commons.collections.CollectionUtils.isEmpty(deleteJobList)) {
			defectRepoRepository.delete(deleteJobList);
		}
	}



	@SuppressWarnings("PMD.AvoidDeeplyNestedIfStmts") // agreed PMD, fixme
	private void clean(DefectCollector collector, List<DefectRepo> existingProjects) {
		Set<ObjectId> uniqueIDs = new HashSet<>();
		for (com.capitalone.dashboard.model.Component comp : dbComponentRepository
				.findAll()) {
			if (comp.getCollectorItems() != null && !comp.getCollectorItems().isEmpty()) {
				List<CollectorItem> itemList = comp.getCollectorItems().get(
						CollectorType.TDP);
				if (itemList != null) {
					for (CollectorItem ci : itemList) {
						if (ci != null && ci.getCollectorId().equals(collector.getId())) {
							uniqueIDs.add(ci.getId());
						}
					}
				}
			}
		}
		List<DefectRepo> stateChangeJobList = new ArrayList<DefectRepo>();
		Set<ObjectId> udId = new HashSet<>();
		udId.add(collector.getId());
		for (DefectRepo job : existingProjects) {
			if ((job.isEnabled() && !uniqueIDs.contains(job.getId())) ||  // if it was enabled but not on a dashboard
					(!job.isEnabled() && uniqueIDs.contains(job.getId()))) { // OR it was disabled and now on a dashboard
				job.setEnabled(uniqueIDs.contains(job.getId()));
				stateChangeJobList.add(job);
			}
		}
		if (!org.apache.commons.collections.CollectionUtils.isEmpty(stateChangeJobList)) {
			defectRepoRepository.save(stateChangeJobList);
		}
	}

	/**
	 * Add any new {@link BinaryDefect}s
	 *
	 * @param instanceURL
	 * list of enabled {@link DefectRepo}s
	 */
	private void addNewDefects(String instanceURL) {
		long start = System.currentTimeMillis();

		int count = 0;
		/*
		for (DefectRepo repo : enabledRepos) {
			for (BinaryDefect artifact : nullSafe(defectClient.getDefects(repo.getInstanceUrl(), repo.getRepoName(), repo.getLastUpdated()))) {
				if (artifact != null && isNewDefect(repo, artifact)) {
					artifact.setCollectorItemId(repo.getId());
					binaryDefectRepository.save(artifact);
					count++;
				}
			}
		}

		// Iterate through list of repos and update the lastUpdated timestamp
    	for (DefectRepo repo : enabledRepos) {
    		repo.setLastUpdated(start);
    	}   	*/

		log("New artifacts", start, count);
	}

	private List<BinaryDefect> nullSafe(List<BinaryDefect> builds) {
		return builds == null ? new ArrayList<BinaryDefect>() : builds;
	}


	private boolean isNewDefect(BinaryDefect artifact) {
		return false;
	}



	public WebDriver getChromeDriver() {

		ChromeOptions chromeOptions = new ChromeOptions();
		Map<String, Object> prefs = new HashMap<String, Object>();
		prefs.put("download.default_directory", defectSettings.getDownloadpath());
		//DesiredCapabilities caps = DesiredCapabilities.chrome();
		chromeOptions.setExperimentalOption("prefs", prefs);
		//caps.setCapability(ChromeOptions.CAPABILITY, chromeOptions);
		System.setProperty("webdriver.chrome.driver", defectSettings.getWebdriver());
		WebDriver driver  = new ChromeDriver(chromeOptions);
		driver.manage().timeouts().implicitlyWait(180, TimeUnit.SECONDS);
		return driver;
	}

	private void writeDefectsToDB(List<DefectRepo> defectRepoList){

		for(DefectRepo defectRepo : defectRepoList){
			if( ( defectRepo.getQueryURL() == null || defectRepo.getQueryURL().isEmpty() )
					|| ( defectRepo.getQueryName()== null || defectRepo.getQueryName().isEmpty() )
					|| ( defectRepo.getUserName()== null || defectRepo.getUserName().isEmpty() )
					|| ( defectRepo.getPassword()== null || defectRepo.getPassword().isEmpty() )){
				LOGGER.info(" Partial Configuration. Skipping this reading files. Collector Id :{}, queryURL : {} , queryName : {} ", defectRepo.getId().toString(), defectRepo.getQueryURL(), defectRepo.getQueryName());
				continue;
			}

			try{

				String fileName = defectRepo.getQueryName() + ".csv";
				String csvFile = defectSettings.getDownloadpath() + "\\" + fileName;
				LOGGER.info("csv File" + csvFile);
				File  csvDiskFile = new File(csvFile);
				LOGGER.info(" CSV File : {}", csvFile);
				if(csvDiskFile.exists()) {
					List<Defect> defects = readCSVFile(Defect.class, csvFile);
					LOGGER.info(" Received set of Defects. Size : {}", defects.size());
					List<BinaryDefect> binaryDefects = binaryDefectRepository.findByCollectorItemIdOrderByTimestampDesc(defectRepo.getId());
					if(binaryDefects  != null && binaryDefects.size() > 0 ) {
						BinaryDefect binaryDefect = binaryDefects.get(0);
						binaryDefect.setCollectorItemId(defectRepo.getId());
						TDPApiResponse tdpApiResponse = new TDPApiResponse();
						tdpApiResponse.setDetail(defects);
						analyseDefects(tdpApiResponse);
						binaryDefect.setDefectAnalysis(tdpApiResponse);
						binaryDefectRepository.save(binaryDefect);
						LOGGER.info(" Data inserted Successfully : Query :{} , Name : {}",defectRepo.getQueryURL(),defectRepo.getQueryName());
					}
					else{
						BinaryDefect binaryDefect = new BinaryDefect();
						binaryDefect.setCollectorItemId(defectRepo.getId());
						TDPApiResponse tdpApiResponse = new TDPApiResponse();
						tdpApiResponse.setDetail(defects);
						analyseDefects(tdpApiResponse);
						binaryDefect.setDefectAnalysis(tdpApiResponse);
						binaryDefect.setUsername(defectRepo.getUserName());
						binaryDefect.setQueryURL(defectRepo.getQueryURL());
						binaryDefect.setQueryName(defectRepo.getQueryName());
						//binaryDefect.setTimestamp();
						binaryDefectRepository.save(binaryDefect);
						LOGGER.info(" Data inserted Successfully : Query :{} , Name : {}",defectRepo.getQueryURL(),defectRepo.getQueryName());
					}
				}
				else{
					LOGGER.info(" Data File does not exist  : {}, Filename : {} ",defectRepo.getQueryURL(),defectRepo.getQueryName());
				}
			}
			catch (Exception ex){
				LOGGER.error( "issue occurred while reading Defect data for the Query {} , Exception = {}", defectRepo.getQueryURL(), ex);

			}

		}

	}


	public <T> List<T> readCSVFile(Class<T> type, String fileName){

		File csvFile = null;

		try {
			CsvSchema bootstrapSchema = CsvSchema.emptySchema().withHeader().withColumnSeparator('\t');
			CsvMapper mapper = new CsvMapper();
			File file = new File(fileName);
			MappingIterator<T> readValues = null;
			if(file.canRead()) {
				readValues = mapper.reader(type).with(bootstrapSchema).readValues(file);
			}
			if(file.canWrite()) {
				//   file.delete();
			}

			if(readValues != null)
				return readValues.readAll();
			else
				return Collections.emptyList();
		} catch (Exception e) {
			LOGGER.error( " Exception while reading Files : {}" , e);
			return Collections.emptyList();
		}

	}

	public void analyseDefects(TDPApiResponse apiResponse){

		List<Defect> defects = new ArrayList<Defect>();
		defects = apiResponse.getDetail();

		Map<String,String> defectStatus = new HashMap<String,String>();
		Map<String,String> defectSeverity = new HashMap<String,String>();
		Map<String,Map<String,List<String>>> defectSeverityDetail = new HashMap<String,Map<String,List<String>>>();
		Map<String,String> defectPriority = new HashMap<String,String>();
		List<String> last2days = new ArrayList<String>();
		List<String> last5days = new ArrayList<String>();
		List<String> last10days = new ArrayList<String>();
		List<String> last20days = new ArrayList<String>();

		try{

			for(Defect defect: defects){

				defectStatus = setDefectStatus(defect,defectStatus);
				if(isOpenDefect(defect)) {
					defectSeverity = setDefectSeverity(defect, defectSeverity,defectSeverityDetail);
					defectPriority = setDefectPriority(defect, defectPriority);
				}
				LocalDate today = LocalDate.now();

				defect.getCreationDate().getTime();
				LocalDate creationDate = new java.sql.Date( defect.getCreationDate().getTime()).toLocalDate();
				Period p = Period.between(creationDate, today);
				defect.setAge(p.getDays());
				if(defect.getAge() == 2)
					last2days.add(defect.getId());
				else if(defect.getAge() >=3 && defect.getAge() < 10 )
					last5days.add(defect.getId());
				else if(defect.getAge() >=10 && defect.getAge() < 20 )
					last10days.add(defect.getId());
				else if(defect.getAge() >=20  )
					last20days.add(defect.getId());
			}

			apiResponse.setLast2Days(last2days);
			apiResponse.setLast5Days(last5days);
			apiResponse.setLast10Days(last10days);
			apiResponse.setLast20Days(last20days);

			BreakUp categories = new BreakUp();
			categories.setInfo(defectStatus);
			apiResponse.setCategories(categories);


			BreakUp severities = new BreakUp();
			severities.setInfo(defectSeverity);
			severities.setDetail(defectSeverityDetail);
			apiResponse.setSeverities(severities);

			BreakUp priorities = new BreakUp();
			priorities.setInfo(defectPriority);
			apiResponse.setPriorities(priorities);

			apiResponse.setDetail(defects);

		}
		catch(Exception e){
			e.printStackTrace();
		}

	}


	public boolean  isOpenDefect(Defect defect){

		boolean flag = false;

		if(defect != null){

			switch(defect.getStatus()) {
				case "Open / In Analysis":
				case "New":
				case "Deferred":
				case "Retest Failed":
				case "Assigned / Fix in Progress":
				case "Retest Blocked":
				case "Fixed":
				case "Scheduled / Delivered":
				case "Retest" :

					flag = true;
					break;
				default:
					flag = false;
					break;
			}
		}
		return flag;
	}

	public Map<String,String>   setDefectStatus(Defect defect, Map<String,String> defectStatus){


		if(defectStatus.containsKey(defect.getStatus())){
			int cnt = Integer.valueOf(defectStatus.get(defect.getStatus()));
			cnt = cnt+1;
			defectStatus.put(defect.getStatus(),String.valueOf(cnt));
		}
		else{
			defectStatus.put(defect.getStatus(),String.valueOf(1));
		}

		return defectStatus;
	}


	public Map<String,String>   setDefectSeverity(Defect defect, Map<String,String> defectSeverity,
												  Map<String,Map<String,List<String>>>  defectSeverityDetail){

		// Info Logic
		if(defectSeverity.containsKey(defect.getSeverity())){
			int sev_cnt = Integer.valueOf(defectSeverity.get(defect.getSeverity()));
			sev_cnt = sev_cnt+1;
			defectSeverity.put(defect.getSeverity(),String.valueOf(sev_cnt));
		}
		else{
			defectSeverity.put(defect.getSeverity(),String.valueOf(1));
		}

		//Detail Logic
		if(defectSeverityDetail.containsKey(defect.getSeverity())){
			Map<String,List<String>> defectMap = new HashMap<String,List<String>>();
			List<String> defectStatus = new ArrayList<String>();
			defectMap = defectSeverityDetail.get(defect.getSeverity());
			if(defectMap != null && defectMap.size() > 0 ){
				if(defectMap.containsKey(defect.getStatus())){
					defectStatus = defectMap.get(defect.getStatus());
				}
			}
			defectStatus.add(defect.getId());
			defectMap.put(defect.getStatus(),defectStatus);
			defectSeverityDetail.put(defect.getSeverity(),defectMap);
		}
		else{

			Map<String,List<String>> defectMap = new HashMap<String,List<String>>();
			List<String> defectStatus = new ArrayList<String>();
			defectStatus.add(defect.getId());
			defectMap.put(defect.getStatus(),defectStatus);
			defectSeverityDetail.put(defect.getSeverity(),defectMap);
		}



		return defectSeverity;
	}

	public Map<String,String>   setDefectPriority(Defect defect, Map<String,String> defectPriority){

		if(defectPriority.containsKey(defect.getPriority())){
			int sev_cnt = Integer.valueOf(defectPriority.get(defect.getPriority()));
			sev_cnt = sev_cnt+1;
			defectPriority.put(defect.getPriority(),String.valueOf(sev_cnt));
		}
		else{
			defectPriority.put(defect.getPriority(),String.valueOf(1));
		}
		return defectPriority;
	}



	public void refreshData(List<DefectRepo>  existingTDPs, DefectClient defectClient){


		for(DefectRepo defectRepo : existingTDPs) {

			LOGGER.info(" Collector Id :{}, queryURL : {} , queryName : {} ", defectRepo.getId().toString(), defectRepo.getQueryURL(), defectRepo.getQueryName());

			if( ( defectRepo.getQueryURL() == null || defectRepo.getQueryURL().isEmpty() )
					|| ( defectRepo.getQueryName()== null || defectRepo.getQueryName().isEmpty() )
					|| ( defectRepo.getUserName()== null || defectRepo.getUserName().isEmpty() )
					|| ( defectRepo.getPassword()== null || defectRepo.getPassword().isEmpty() )){
				LOGGER.info(" Partial Configuration. Skipping this collection. Collector Id :{}, queryURL : {} , queryName : {} ", defectRepo.getId().toString(), defectRepo.getQueryURL(), defectRepo.getQueryName());
				continue;
			}

			try {

				driver.get(defectRepo.getQueryURL());
				String appTitle = driver.getTitle();
				if (appTitle != null && appTitle.equalsIgnoreCase(DefectConstant.loginForm)) {
					WebElement userId = driver.findElement(By.id(DefectConstant.userIdField));
					if (userId != null) {
						userId.sendKeys(defectRepo.getUserName());
					}
					WebElement passwordField = driver.findElement(By.id(DefectConstant.secretField));
					if (passwordField != null) {
						passwordField.sendKeys(defectRepo.getPassword());
						passwordField.sendKeys(Keys.ENTER);
					}

					String loggedInTitle = driver.getTitle();
					System.out.println("Current page title is :: " + loggedInTitle);
					String queryTemp = loggedInTitle;

					if (loggedInTitle != null && loggedInTitle.contains("Change and Configuration Management")) {
						WebElement downloadCSVContainer = driver.findElement(By.id(DefectConstant.downloadButton));
						if (downloadCSVContainer != null && downloadCSVContainer.findElement(By.tagName("a")) != null) {
							String queryTemp2 = queryTemp.replaceAll("Query: ","");
							String queryTemp3 = queryTemp2.replaceAll(" - Change and Configuration Management","");
							LOGGER.info(" current page title after modification :{}",queryTemp3);
							defectRepo.setQueryName(queryTemp3);
							WebElement downloadCSVButton = downloadCSVContainer.findElement(By.tagName("a"));
							downloadCSVButton.click();
						}
					}

				} else {

					String loggedInTitle = driver.getTitle();
					System.out.println("Current page title is :: " + loggedInTitle);
					String queryTemp = loggedInTitle;
					if (loggedInTitle != null && loggedInTitle.contains("Change and Configuration Management")) {
						WebElement downloadCSVContainer = driver.findElement(By.id(DefectConstant.downloadButton));
						if (downloadCSVContainer != null && downloadCSVContainer.findElement(By.tagName("a")) != null) {
							String queryTemp2 = queryTemp.replaceAll("Query: ","");
							String queryTemp3 = queryTemp2.replaceAll(" - Change and Configuration Management","");
							LOGGER.info(" current page title after modification :{}",queryTemp3);
							defectRepo.setQueryName(queryTemp3);
							WebElement downloadCSVButton = downloadCSVContainer.findElement(By.tagName("a"));
							downloadCSVButton.click();
						}
					}
				}
				Thread.sleep(TimeUnit.SECONDS.toMillis(2));
			} catch (Exception e) {
				LOGGER.info("  Issue exist while retrieve data from  CollectorId : {}, SDP URL : {} ,   defect details :  {}", defectRepo.getCollectorId(), defectRepo.getQueryURL(), e);

			}
		}

	}



}
