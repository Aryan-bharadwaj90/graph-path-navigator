let map;
let markers = [];
let points = [];
let edges = [];
let graph = {};
let polyline = null;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 28.6139, lng: 77.2090 }, // Delhi
    zoom: 13,
  });

  map.addListener("click", (e) => {
    addMarker(e.latLng);
  });
}

function addMarker(position) {
  const marker = new google.maps.Marker({
    position,
    map,
  });

  const latLng = [position.lat(), position.lng()];
  points.push(latLng);
  markers.push(marker);

  if (points.length >= 2) {
    buildGraph();
    findShortestPath(0, points.length - 1);
  }
}

function resetMap() {
  markers.forEach((m) => m.setMap(null));
  markers = [];
  points = [];
  graph = {};
  if (polyline) polyline.setMap(null);
  document.getElementById("distance").innerText = "";
}

function haversine(a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371e3;

  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const a1 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));
}

function buildGraph() {
  graph = {};
  for (let i = 0; i < points.length; i++) {
    graph[i] = [];
    for (let j = 0; j < points.length; j++) {
      if (i !== j) {
        const dist = haversine(points[i], points[j]);
        graph[i].push({ node: j, weight: dist });
      }
    }
  }
}

class MinPriorityQueue {
  constructor() {
    this.heap = [];
  }

  enqueue(element, priority) {
    this.heap.push({ element, priority });
    this.heap.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.heap.shift();
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

// function findShortestPath(start, end) {
//   const distances = {};
//   const prev = {};
//   const visited = {};
//   const pq = new MinPriorityQueue();

//   for (let i = 0; i < points.length; i++) {
//     distances[i] = Infinity;
//     visited[i] = false;
//   }

//   distances[start] = 0;
//   pq.enqueue(start, 0);

//   while (!pq.isEmpty()) {
//     const { element: current } = pq.dequeue();

//     if (visited[current]) continue;
//     visited[current] = true;

//     for (let neighbor of graph[current]) {
//       const alt = distances[current] + neighbor.weight;
//       if (alt < distances[neighbor.node]) {
//         distances[neighbor.node] = alt;
//         prev[neighbor.node] = current;
//         pq.enqueue(neighbor.node, alt);
//       }
//     }
//   }

//   let path = [];
//   let u = end;
//   while (u !== undefined) {
//     path.push(points[u]);
//     u = prev[u];
//   }

//   path.reverse();

//   if (polyline) polyline.setMap(null);

//   polyline = new google.maps.Polyline({
//     path: path.map((coord) => ({ lat: coord[0], lng: coord[1] })),
//     geodesic: true,
//     strokeColor: "#FF0000",
//     strokeOpacity: 1.0,
//     strokeWeight: 4,
//   });

//   polyline.setMap(map);

//   const dist = distances[end].toFixed(2);
//   document.getElementById("distance").innerText = `Shortest Path Distance: ${dist} meters`;
// }
function findShortestPath(start, end) {
  const gScore = {};
  const fScore = {};
  const prev = {};
  const openSet = new MinPriorityQueue();

  for (let i = 0; i < points.length; i++) {
    gScore[i] = Infinity;
    fScore[i] = Infinity;
  }

  gScore[start] = 0;
  fScore[start] = haversine(points[start], points[end]);
  openSet.enqueue(start, fScore[start]);

  const visited = {};

  while (!openSet.isEmpty()) {
    const { element: current } = openSet.dequeue();

    if (current === end) break;
    if (visited[current]) continue;
    visited[current] = true;

    for (const neighbor of graph[current]) {
      const tentativeG = gScore[current] + neighbor.weight;
      if (tentativeG < gScore[neighbor.node]) {
        prev[neighbor.node] = current;
        gScore[neighbor.node] = tentativeG;
        fScore[neighbor.node] =
          tentativeG + haversine(points[neighbor.node], points[end]);
        openSet.enqueue(neighbor.node, fScore[neighbor.node]);
      }
    }
  }

  // Reconstruct Path
  let path = [];
  let current = end;
  while (current !== undefined) {
    path.push(points[current]);
    current = prev[current];
  }

  path = path.reverse();

  if (polyline) polyline.setMap(null);

  polyline = new google.maps.Polyline({
    path: path.map((coord) => ({ lat: coord[0], lng: coord[1] })),
    geodesic: true,
    strokeColor: "#00BFFF",
    strokeOpacity: 1.0,
    strokeWeight: 4,
  });

  polyline.setMap(map);

  document.getElementById("distance").innerText = `A* Shortest Path Distance: ${gScore[end].toFixed(2)} meters`;
}

window.initMap = initMap;
