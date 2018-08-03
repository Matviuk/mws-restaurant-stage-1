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
