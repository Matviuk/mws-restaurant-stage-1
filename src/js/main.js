let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  // updateRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });

  // Use IntersectionObserver for lazy loading images
  const images = window.document.querySelectorAll('source, img');
  const config = {
    rootMargin: '0px',
    threshold: 0.1
  };
  let observer;

  let preloadImage = (element) => {

    if(element.dataset && element.dataset.src) {
      element.src = element.dataset.src;
    }

    if(element.dataset && element.dataset.srcset) {
      element.srcset = element.dataset.srcset
    }
  }

  let onIntersection = (entries) => {
    entries.forEach(entry => {
      if (entry.intersectionRatio > 0) {
        observer.unobserve(entry.target);
        preloadImage(entry.target);
      }
    });
  }

  if (!('IntersectionObserver' in window)) {
    Array.from(images).forEach(image => preloadImage(image));
  } else {
    observer = new IntersectionObserver(onIntersection, config);
    images.forEach(image => {
      observer.observe(image);
    });
  }

  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.setAttribute("role" , "listitem");

  if (restaurant.photograph) {
    const picture = document.createElement('picture');
    const webp1 = document.createElement('source');
    const webp2 = document.createElement('source');
    const jpg1 = document.createElement('source');
    const jpg2 = document.createElement('source');
    const image = document.createElement('img');

    picture.className = 'restaurant-img';
    // image.className = 'restaurant-img';

    // webp1.setAttribute('data-srcset', `/img/${restaurant.photograph}-680.webp`);
    // webp1.setAttribute('media', '(max-width: 540px), (min-width: 2100px)');
    // webp1.setAttribute('type', 'image/webp');
    webp1.dataset.srcset = `/img/${restaurant.photograph}-680.webp`;
    webp1.media = '(max-width: 540px), (min-width: 2100px)';
    webp1.type = 'image/webp';
    picture.append(webp1);

    // webp2.setAttribute('data-srcset', `/img/${restaurant.photograph}-390.webp`);
    // webp2.setAttribute('media', '(min-width: 541px) and (max-width: 2099px)');
    // webp2.setAttribute('type', 'image/webp');
    webp2.dataset.srcset = `/img/${restaurant.photograph}-390.webp`;
    webp2.media = '(min-width: 541px) and (max-width: 2099px)';
    webp2.type = 'image/webp';
    picture.append(webp2);

    // jpg1.setAttribute('data-srcset', `/img/${restaurant.photograph}-680.jpg`);
    // jpg1.setAttribute('media', '(max-width: 540px), (min-width: 2100px)');
    // jpg1.setAttribute('type', 'image/jpeg');
    jpg1.dataset.srcset = `/img/${restaurant.photograph}-680.jpg`;
    jpg1.media = '(max-width: 540px), (min-width: 2100px)';
    jpg1.type = 'image/jpeg';
    picture.append(jpg1);

    // jpg2.setAttribute('data-srcset', `/img/${restaurant.photograph}-390.jpg`);
    // jpg2.setAttribute('media', '(min-width: 541px) and (max-width: 2099px)');
    // jpg2.setAttribute('type', 'image/jpeg');
    jpg2.dataset.srcset = `/img/${restaurant.photograph}-390.jpg`;
    jpg2.media = '(min-width: 541px) and (max-width: 2099px)';
    jpg2.type = 'image/jpeg';
    picture.append(jpg2);

    image.src = `/img/${restaurant.photograph}-15.jpg`;
    // image.setAttribute('data-src', `/img/${restaurant.photograph}-390.jpg`);
    // image.setAttribute('alt', `Photo of ${restaurant.name} restaurant`);
    image.dataset.src = `/img/${restaurant.photograph}-390.jpg`;
    image.alt = `Photo of ${restaurant.name} restaurant`;
    picture.append(image);

    li.append(picture);
    // li.append(image);
  }

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  name.tabIndex = 0;
  name.setAttribute('aria-label' , `Restaurant ${restaurant.name} in ${restaurant.neighborhood}`);
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('title', `View details about ${restaurant.name} restaurant`);
  more.setAttribute('aria-label', `View details about ${restaurant.name} restaurant`);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
