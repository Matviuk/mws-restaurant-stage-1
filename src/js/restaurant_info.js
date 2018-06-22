let restaurant;
var map;

document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
    }
  });
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURLForMap((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      // fillBreadcrumb();
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
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
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
  date.innerHTML = review.date;
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
