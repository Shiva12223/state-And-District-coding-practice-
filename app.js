const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const startDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is runing at 3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
startDBAndServer();

const convertEachStateNameIntoPascalScale = (eachMovieObj) => {
  return {
    stateId: eachMovieObj.state_id,
    stateName: eachMovieObj.state_name,
    population: eachMovieObj.population,
  };
};

app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    SELECT * FROM state WHERE state_id`;
  const getAllStatesArray = await db.all(getAllStatesQuery);
  response.send(
    getAllStatesArray.map((eachStateName) =>
      convertEachStateNameIntoPascalScale(eachStateName)
    )
  );
});

const convertStateNameIntoPascalScale = (stateObj) => {
  return {
    stateId: stateObj.state_id,
    stateName: stateObj.state_name,
    population: stateObj.population,
  };
};

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id = ${stateId}`;
  const getStateArray = await db.get(getStateQuery);
  response.send(convertStateNameIntoPascalScale(getStateArray));
});

app.post("/districts/", async (request, response) => {
  const getDistrictsQuery = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = getDistrictsQuery;
  const addDistrictQueryName = `
    INSERT INTO 
    district(district_name, state_id, cases, cured, active, deaths)
    VALUES
      (
          '${districtName}',
          '${stateId}',
          '${cases}',
          '${cured}',
          '${active}',
          '${deaths}'         
      )            
    `;
  const dbResponse = await db.run(addDistrictQueryName);
  const addDistrict = dbResponse.lastID;
  response.send("District Successfully Added");
});
const convertDistrictArrayIntoPascalScale = (districtArrayObj) => {
   try{
       return {
    districtId: districtArrayObj.district_id,
    districtName: districtArrayObj.district_name,
    stateId: districtArrayObj.state_id,
    cases: districtArrayObj.cases,
    cured: districtArrayObj.cured,
    active: districtArrayObj.active,
    deaths: districtArrayObj.deaths
  }
   }catch(e){
       console.log(`District Array: ${e.message}`)
   }
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id = ${districtId}`;
  const getDistrictArray = await db.get(getDistrictQuery);
  response.send(convertDistrictArrayIntoPascalScale(getDistrictArray));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE  FROM district WHERE district_id = ${districtId}`;
  const deleteDistrictArray = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE 
    district
    SET 
    district_name = '${districtName}',
    state_id = '${stateId}',
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}'
    WHERE 
    district_id = ${districtId}`;
  const upDateDistrict = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT SUM(cases),
           SUM(cured),
           SUM(active),
           SUM(deaths)
    FROM district                
           WHERE state_id = ${stateId} 
    `;
  const stateStats = await db.get(getStateStatsQuery);
  console.log(stateStats);
  response.send({
    totalCases: stateStats["SUM(cases)"],
    totalCured: stateStats["SUM(cured)"],
    totalActive: stateStats["SUM(active)"],
    totalDeaths: stateStats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    SELECT state_id 
    FROM  district               
    WHERE district_id = ${districtId} 
    `;
  const getStateIdResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
     SELECT state_name FROM state
     WHERE state_id = ${getStateIdResponse.state_id}`;
  const getStateNameResponse = await db.get(getStateNameQuery);

  response.send({
    stateName: getStateNameResponse.state_name,
  });
});
module.exports = app;
