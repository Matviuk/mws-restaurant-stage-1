if (navigator.serviceWorker) {
  navigator.serviceWorker.register('/sw.js', {scope: './'}).then(function(reg) {
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch(function(error) {
    console.log('Registration failed with ' + error);
  });
}
var restaurant;
var map;
var connectionChecker;

/**
 * Toggle map visibility
 */
document.addEventListener('DOMContentLoaded', (event) => {
  const mapbtn = document.getElementById('show-map');
  const mapbox = document.getElementById('map-container');
  mapbtn.addEventListener('click', event => {
    mapbox.classList.toggle('active');

    if (mapbox.classList.contains('active')) {
      mapbtn.innerHTML = 'Hide the map';
    } else {
      mapbtn.innerHTML = 'View results on the map';
    }
  });
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL (for Google map).
 */
fetchRestaurantFromURLForMap = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      callback(null, restaurant)
    });
  }
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.setAttribute('aria-label', `${restaurant.name} restaurant`)

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.setAttribute('aria-label', `Address: ${restaurant.address}`)

  if (restaurant.photograph) {
    const picture = document.getElementById('restaurant-img');
    const webp1 = document.createElement('source');
    const webp2 = document.createElement('source');
    const webp3 = document.createElement('source');
    const jpg1 = document.createElement('source');
    const jpg2 = document.createElement('source');
    const jpg3 = document.createElement('source');
    const image = document.createElement('img');

    webp1.dataset.srcset = `/img/${restaurant.photograph}-680.webp`;
    webp1.media = '(min-width: 471px) and (max-width: 760px), (min-width: 941px) and (max-width: 1520px)';
    webp1.type = 'image/webp';
    picture.append(webp1);

    webp2.dataset.srcset = `/img/${restaurant.photograph}-390.webp`;
    webp2.media = '(max-width: 470px), (min-width: 841px) and (max-width: 940px)';
    webp2.type = 'image/webp';
    picture.append(webp2);

    webp3.dataset.srcset = `/img/${restaurant.photograph}-original.webp`;
    webp3.media = '(min-width: 761px) and (max-width: 840px), (min-width: 1521px)';
    webp3.type = 'image/webp';
    picture.append(webp3);

    jpg1.dataset.srcset = `/img/${restaurant.photograph}-680.jpg`;
    jpg1.media = '(min-width: 471px) and (max-width: 760px), (min-width: 941px) and (max-width: 1520px)';
    jpg1.type = 'image/jpeg';
    picture.append(jpg1);

    jpg2.dataset.srcset = `/img/${restaurant.photograph}-390.jpg`;
    jpg2.media = '(max-width: 470px), (min-width: 841px) and (max-width: 940px)';
    jpg2.type = 'image/jpeg';
    picture.append(jpg2);

    jpg3.dataset.srcset = `/img/${restaurant.photograph}-original.jpg`;
    jpg3.media = '(min-width: 761px) and (max-width: 840px), (min-width: 1521px)';
    jpg3.type = 'image/jpeg';
    picture.append(jpg3);

    image.src = `/img/${restaurant.photograph}-15.jpg`;
    image.dataset.src = `/img/${restaurant.photograph}-original.jpg`;
    image.alt = `${restaurant.name} restaurant's photo`;
    picture.append(image);
  }

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  const addToFav = document.getElementById('add-to-fav');
  if(restaurant.is_favorite === true || restaurant.is_favorite == 'true') {
    addToFav.setAttribute('aria-checked', 'true');
    addToFav.title = `Remove ${restaurant.name} from favorites`;
    addToFav.setAttribute('aria-label', `Remove ${restaurant.name} from favorites`);
    addToFav.innerHTML = 'Remove from favorites <span>&#x2764;</span>';
    addToFav.classList.add('active');
  } else {
    addToFav.setAttribute('aria-checked', 'false');
    addToFav.title = `Add ${restaurant.name} to favorites`;
    addToFav.setAttribute('aria-label', `Add ${restaurant.name} to favorites`);
    addToFav.innerHTML = 'Add to favorites <span>&#x2764;</span>';
    addToFav.classList.remove('active');
  }
  addToFav.addEventListener('click', event => {
    let favoriteStat; // Variable for favorite status
    let alertText;

    if (addToFav.classList.contains('active')) {
      favoriteStat = true;
    } else {
      favoriteStat = false;
    }

    DBHelper.toggleFavStat(restaurant.id, favoriteStat)
      .then((data) => {
        self.restaurant = data;

        if (data.is_favorite === true || data.is_favorite == 'true') {
          addToFav.setAttribute('aria-checked', 'true');
          addToFav.title = `Remove ${restaurant.name} from favorites`;
          addToFav.setAttribute('aria-label', `Remove ${restaurant.name} from favorites`);
          addToFav.innerHTML = 'Remove from favorites <span>&#x2764;</span>';
          addToFav.classList.add('active');
          alertText = `${restaurant.name} has been added to your favorites`;
        } else {
          addToFav.setAttribute('aria-checked', 'false');
          addToFav.title = `Add ${restaurant.name} to favorites`;
          addToFav.setAttribute('aria-label', `Add ${restaurant.name} to favorites`);
          addToFav.innerHTML = 'Add to favorites <span>&#x2764;</span>';
          addToFav.classList.remove('active');
          alertText = `${restaurant.name} has been removed from your favorites`;
        }

        dispAlertBlock(alertText, 'success');
      })
      .catch((error) => console.error(error));
  });

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();

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
      element.srcset = element.dataset.srcset;
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
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  // const title = document.createElement('h2');
  // title.innerHTML = 'Reviews';
  // container.appendChild(title);

  DBHelper.fetchReviewsById(getParameterByName('id'))
    .then(reviews => {
      if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
      }

      self.restaurant.reviews = reviews;

      const ul = document.getElementById('reviews-list');
      reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
      });
      // container.appendChild(ul);

      // Add data to review form
      const form = document.getElementById('review-form');
      const idInput = document.getElementById('restaurant-id');
      idInput.value = reviews.restaurant_id;

      form.addEventListener('submit', function(event) {
        event.preventDefault();

        const restID = parseInt(stripTags(document.getElementById('restaurant-id').value));
        if (isNaN(restID)) {
          dispAlertBlock('Sorry, the form can not be sent now. Try later.', 'error');
          return;
        }

        let name = stripTags(document.getElementById('name').value);
        if (name.trim().length < 1) {
          dispAlertBlock('You did not enter your name!', 'error');
          return;
        }
        let radiobox = document.querySelector('input[name="rating"]:checked');
        let rating = 0;
        if (radiobox) {
          rating = parseInt(radiobox.value);
        }
        if (rating == 0 || isNaN(rating)) {
          dispAlertBlock('You did not choose rating!', 'error');
          return;
        }

        let comments = stripTags(document.getElementById('comments').value);
        if (comments.trim().length < 1) {
          dispAlertBlock('You did not enter your comment!', 'error');
          return;
        }

        sendReview(restID, name, rating, comments, ul, form);
      });
    })
    .catch(error => console.error(error));
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.tabindex = 0;
  const hdr = document.createElement('h3');
  const name = document.createElement('span');
  name.className = 'review-name';
  name.innerHTML = review.name;
  hdr.appendChild(name);

  const date = document.createElement('span');
  date.innerHTML = new Date(review.updatedAt).toDateString();
  date.setAttribute('class', 'review-date');
  hdr.appendChild(date);
  li.appendChild(hdr);

  const rating = document.createElement('p');
  rating.className = 'review-rating';
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Send review or save it for later
*/
sendReview = (restID, name, rating, comments, ul, form) => {
  DBHelper.sendReviewToServer(restID, name, rating, comments, self.restaurant.reviews)
    .then(data => {
      form.reset();
      dispAlertBlock('Thank you for your review!', 'success');
      ul.appendChild(createReviewHTML(data));
    })
    .catch(error => {
      if (navigator.onLine) {
        dispAlertBlock('Your review could not be sent.', 'error');
      } else {
        DBHelper.saveOfflineReviewToIDB(restID, name, rating, comments);
        dispAlertBlock('You are offline. Your review will be sent when the connection is restored' , 'error');

        connectionChecker = setInterval(() => {
          checkConnection(restID, ul, form);
        }, 2000);
      }
    });
}

/**
 * Check connection, if online - send review.
 */
checkConnection = (restID, ul, form) => {
  if (navigator.onLine) {
    clearInterval(connectionChecker);
    dispAlertBlock('You are online. We are sending your review now.', 'success');

    DBHelper.sendReviewFromIDB(restID, self.restaurant.reviews)
      .then(data => {
        form.reset();
        dispAlertBlock('Thank you for your review!', 'success');
        ul.appendChild(createReviewHTML(data));
      });
  }
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Show messages.
 */
dispAlertBlock = (text, alertType = 'success') => {
  const alertBlock = document.querySelector('.alert');
  // const alertClose = document.querySelector('.alert__close');
  alertBlock.innerHTML = text;
  alertBlock.className = 'alert';
  alertBlock.classList.add(`alert-${alertType}`);
  alertBlock.classList.add('active');

  // alertClose.addEventListener('click', event => {
  //   alertBlock.classList.remove('active');
  // });

  setTimeout(() => {
    alertBlock.classList.remove('active');
  }, 5000);
}

stripTags = (str) => {
    let tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi; // Match any html tag
    let commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi; // Match <!--, -->, <?, <?php and ?>
    return str.replace(commentsAndPhpTags, '').replace(tags, ''); // Just replace it by an empty string
}
var IDBPromise; // Variable for IDB promise

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Your server port
    return `http://localhost:${port}`;
  }

  /**
   * Create and/or open IDB.
   */

  static openDatabase() {
    return idb.open("RestReview", 3, function(upgradeDb) {
      let storeRestaurants = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
      let storeReviews = upgradeDb.createObjectStore('reviews', {keyPath: 'restaurant_id'});
      let storeOfflineReviews = upgradeDb.createObjectStore('offlinereviews', {keyPath: 'restaurant_id'});
      storeRestaurants.createIndex('cuisine','cuisine_type');
      storeRestaurants.createIndex('neighborhood','neighborhood');
    });
  }

  /**
   * Fetch all restaurants from IDB.
   */
  static fetchRestaurants(callback) {
    return new Promise((resolve,reject) => {
      if (!IDBPromise) {
        IDBPromise = DBHelper.openDatabase();
      }

      IDBPromise.then(db => {
        if (!db) return db;

        let tx = db.transaction('restaurants');
        let store = tx.objectStore('restaurants');

        store.getAll().then(data => {
          if (data.length > 0 && !navigator.onLine) {
            resolve(data);
          }

          fetch(DBHelper.DATABASE_URL + '/restaurants')
            .then(response => response.json())
            .then(data => {
              IDBPromise.then(db => {
                if (!db) return db;

                let tx = db.transaction('restaurants', 'readwrite');
                let store = tx.objectStore('restaurants');

                data.forEach(restaurant => store.put(restaurant));
              });
              return resolve(data);
            })
            .catch(e => requestError(e, 'Restaurants request from web failed'));
        })
      })
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    if (!IDBPromise) {
      IDBPromise = this.openDatabase();
    }

    IDBPromise.then(db => {
      if (!db) return db;

      let tx = db.transaction('restaurants');
      let store = tx.objectStore('restaurants');

      store.get(parseInt(id))
        .then(data => {
          if (data && data.name.length > 0 && !navigator.onLine) {
            return callback(null, data);
          }

          fetch(DBHelper.DATABASE_URL + '/restaurants/' + id)
            .then(response => response.json())
            .then(data => {
              IDBPromise.then(db => {
                if (!db) return db;

                let tx = db.transaction('restaurants', 'readwrite');
                let store = tx.objectStore('restaurants');

                store.put(data);
              });
              return callback(null, data);
            })
            .catch(e => callback('Restaurant request from web failed', null));
        })
        .catch(e => callback('Restaurant does not exist', null));
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants().then(results => {
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
    }).catch(e => callback(e, null));
  }

  /**
   * Fetch all restaurant's reviews.
   */
  static fetchReviewsById(id) {
    return new Promise((resolve, reject) => {
      DBHelper.getReviewsFromCache(id).then(function(data) {
        if (data && data.length && !navigator.onLine) {
          resolve(data);
        }

        fetch(DBHelper.DATABASE_URL + '/reviews/?restaurant_id=' + id)
          .then(response => response.json())
          .then(data => {
            DBHelper.putReviewsToIDB(data);
            resolve(data);
          })
          .catch(error => reject(error));
      });
    });
  }

  /**
   * Get all restaurant reviews from cache
   */
  static getReviewsFromCache(id) {
    if (!IDBPromise) {
      IDBPromise = this.openDatabase();
    }

    return IDBPromise.then(db => {
      if (!db) return db;

      var tx = db.transaction('reviews');
      var store = tx.objectStore('reviews');

      return store.get(parseInt(id));
    });
  }

  /**
   * Put reviews to IDB
   */
  static putReviewsToIDB(reviews) {
    if (!IDBPromise) {
      IDBPromise = this.openDatabase();
    }

    IDBPromise.then(db => {
      if (!db) return db;

      var tx = db.transaction('reviews', 'readwrite');
      var store = tx.objectStore('reviews');


      if (reviews.length > 0) {
        reviews.restaurant_id = parseInt(reviews[0].restaurant_id);
        store.put(reviews);
      }

      return tx.complete;
    })
  }

  /**
   * Send request with favorite status to the server
   */
  static toggleFavStat(id, favoriteStat) {
    if (typeof(favoriteStat) == 'string') {
      if (favoriteStat == 'true') {
        favoriteStat = false;
      } else {
        favoriteStat = true;
      }
    } else {
      favoriteStat = !favoriteStat;
    }

    return new Promise((resolve, reject) => {
      fetch(DBHelper.DATABASE_URL + '/restaurants/' + id + '/?is_favorite=' + favoriteStat, {
        method: 'PUT'
      })
        .then(response => response.json())
        .then(data => resolve(data));
    });
  }

  /**
   * Send reviews to the server
   */
  static sendReviewToServer(restID, name, rating, comments, reviews) {
    return new Promise((resolve, reject) => {
      console.log(DBHelper.DATABASE_URL + '/reviews/');

      fetch(DBHelper.DATABASE_URL + '/reviews', {
        method: 'POST',
        body: JSON.stringify({
          restaurant_id: restID,
          name: name,
          rating: rating,
          comments: comments
        })
      })
        .then(response => response.json())
        .then(data => {
          reviews.push(data);
          DBHelper.putReviewsToIDB(reviews);
          resolve(data);
        })
        .catch(error => reject(error));
    });
  }

  /**
   * Save user review to IDB
   */
  static saveOfflineReviewToIDB(restID, name, rating, comments) {
    if (!IDBPromise) {
      IDBPromise = this.openDatabase();
    }

    IDBPromise.then(function(db) {
      if (!db) return;

      var tx = db.transaction('offlinereviews', 'readwrite');
      var store = tx.objectStore('offlinereviews');

      store.put({
        restaurant_id: restID,
        name: name,
        rating: rating,
        comments: comments
      });

      return tx.complete;
    })
  }

  /**
   * Send user review to the server if he is online.
   */
  static sendReviewFromIDB(restID, reviews) {
    return new Promise((resolve,reject) => {
      if (!IDBPromise) {
        IDBPromise = DBHelper.openDatabase();
      }

      IDBPromise.then(function(db) {
        if (!db) return;

        var tx = db.transaction('offlinereviews');
        var store = tx.objectStore('offlinereviews');

        return store.get(restID);
      })
      .then(function(review) {
        DBHelper.sendReviewToServer(review.restaurant_id, review.name, review.rating, review.comments, reviews)
          .then(data => {
            IDBPromise.then(function(db) {
              var tx = db.transaction('offlinereviews', 'readwrite');
              var store = tx.objectStore('offlinereviews');

              store.delete(restID);

              return tx.complete;
            });
            resolve(data);
          })
          .catch(error => reject(error));
      });
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants().then(results => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = results.map((v, i) => results[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
    }).catch(e => callback(e, null));
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants().then(results => {
        // Get all cuisines from all restaurants
        const cuisines = results.map((v, i) => results[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
    }).catch(e => callback(e, null));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph) {
      return (`/img/${restaurant.photograph}-original.jpg`);
    } else {
      return false;
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}

'use strict';

(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        },
        set: function(val) {
          this[targetProp][prop] = val;
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getKey',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
      if (!(funcName in Constructor.prototype)) return;

      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      request.onupgradeneeded = function(event) {
        if (upgradeCallback) {
          upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
        }
      };

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = exp;
    module.exports.default = module.exports;
  }
  else {
    self.idb = exp;
  }
}());

//# sourceMappingURL=restaurant-info.js.map
