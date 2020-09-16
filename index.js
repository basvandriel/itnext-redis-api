//set up dependencies
const express = require("express");
const redis = require("redis");
const axios = require("axios");
const bodyParser = require("body-parser");

//setup port constants
const port_redis = process.env.PORT || 6379;
const port = process.env.PORT || 5000;

//configure redis client on port 6379
const redis_client = redis.createClient(port_redis);

//configure express server
const app = express();

//Body Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware function to check cache
checkCache = (request, response, next) => {
    const { id } = request.params;

    redis_client.get(id, (error, data) => {
        if (error) {
            console.log(error);
            res.status(500).send(error);
        }

        data != null ? response.send(data) : next();
    });
}

//  Endpoint:  GET /starships/:id
//  @desc Return Starships data for particular starship id
app.get("/starships/:id", checkCache, async (req, res) => {
    try {
        const { id } = req.params;
        const starShipInfo = await axios.get(
            `https://swapi.dev/api/starships/${id}`
        );

        //get data from response
        const starShipInfoData = starShipInfo.data;

        //add data to Redis
        redis_client.setex(id, 3600, JSON.stringify(starShipInfoData));

        return res.json(starShipInfoData);
    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
});

//listen on port 5000;
app.listen(port, () => console.log(`Server running on Port ${port}`));