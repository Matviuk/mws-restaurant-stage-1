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
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Create and/or open IDB.
   */

  static openDatabase() {
    return idb.open("RestReview", 1, function(upgradeDb) {
      let store = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
      store.createIndex('cuisine','cuisine_type');
      store.createIndex('neighborhood','neighborhood');
    });
  }

  /**
   * Fetch all restaurants from IDB.
   */
  static fetchRestaurants(callback) {
    return new Promise((resolve,reject) => {
      DBHelper.openDatabase().then(db => {
        if (!db) return;

        let tx = db.transaction('restaurants');
        let store = tx.objectStore('restaurants');

        store.getAll().then(data => {
          if (data && data.length > 0) {
            resolve(data);
          }

          fetch(DBHelper.DATABASE_URL)
            .then(response => response.json())
            .then(data => {
              DBHelper.openDatabase().then(db => {
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
    DBHelper.openDatabase().then(db => {
      if (!db) return;

      let tx = db.transaction('restaurants');
      let store = tx.objectStore('restaurants');

      store.get(parseInt(id))
        .then(data => {
          if (data && data.name.length > 0) {
            return callback(null, data);
          }
          fetch(DBHelper.DATABASE_URL + '/' + id)
            .then(response => response.json())
            .then(data => {
              DBHelper.openDatabase().then(db => {
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
      return (`/img/${restaurant.photograph}.jpg`);
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
