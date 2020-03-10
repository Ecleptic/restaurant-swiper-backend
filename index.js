"use strict";

const { stringGen } = require("./stringGen");

const fetch = require("node-fetch");
const express = require("express");

const port = process.env.PORT || 42069;
const app = express();

app.use(express.json());

let servers = {};
const CHARS_GENERATED_LENGTH = 5;

app.get("/healthcheck", (req, res) => res.send("Healthy"));

app.get("/", (req, res) => {
  res.send("Hello World!" + stringGen(5), 200);
});

app.get("/cities", async (req, res) => {
  const cities = await getAllCities();
  res.send(cities);
});

app.get("/restaurant/:id", async (req, res) => {
  const id = req.params.id;
  const restaurant = await getRestaurantById(id);
  res.send(restaurant);
});

app.post("/:city", async (req, res) => {
  console.log(req.params.city);
  const code = await createServer(req.params.city);
  res.send(code);
});

app.get("/session/:id", async (req, res) => {
  res.send(servers[req.params.id]);
});

app.post("/swiped/:sessionId/:restaurantId", (req, res) => {
  const sessionId = req.params.sessionId;
  const restaurantId = req.params.restaurantId;
  //   no idea if this will work. I'm sleepy
  const confirmedRestaurantId = swipeConfirmRestaurant(sessionId, restaurantId);
  res.send(confirmedRestaurantId);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

async function createServer(city, numPeople = 2) {
  const code = getCode(stringGen(CHARS_GENERATED_LENGTH));
  console.log(city);
  const restaurantsList = await getRestaurantsByCity(city);
  const mappedRestaurants = restaurantsList.restaurants.map(place => {
    place.appSwipeConfirms = 0;
    return place;
  });
  servers[code] = {
    code,
    restaurants: mappedRestaurants,
    numPeople
  };
  return code;
}
function getCode(code) {
  if (servers.code !== undefined) {
    getCode(stringGen(CHARS_GENERATED_LENGTH));
  } else {
    return code;
  }
}
async function getRestaurantById(id) {
  const url = `https://opentable.herokuapp.com/api/restaurants/${id}`;
  const res = await fetch(url);
  return res.json();
}
async function getRestaurantsByCity(city) {
  const url = `https://opentable.herokuapp.com/api/restaurants?city=${city}&per_page=100`;
  const res = await fetch(url);
  return res.json();
}
async function getRestaurantsByZip(zip) {
  const url = `https://opentable.herokuapp.com/api/restaurants?zip=${zip}&per_page=100`;
  const res = await fetch(url);
  return res.json();
}
function swipeConfirmRestaurant(sessionId, restaurantId) {
  const session = servers[sessionId];
  const newRestaurantsData = session.restaurants.map(place => {
    if (place.id === restaurantId) {
      place.appSwipeConfirms += 1;
    }
    return place;
  });
  newRestaurantsData.forEach(place => {
    if (place.appSwipeConfirms >= session.numPeople) {
      //   You've got a match
      return restaurantId;
    }
  });
}
async function getAllCities() {
  const res = await fetch("https://opentable.herokuapp.com/api/cities");
  return res.json();
}
