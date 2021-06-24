mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
    container: 'cluster-map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [-103.59179687498357, 40.66995747013945],
    zoom: 3
});

map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () { // Add a new source from our GeoJSON data and set the 'cluster' option to true. GL-JS will add the point_count property to your source data.
    map.addSource('campgrounds', {
        type: 'geojson', // Point to GeoJSON data.        
        data: campgrounds,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });

    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'campgrounds',
        filter: ['has', 'point_count'],
        paint: { // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step) with four steps to implement four types of circles:
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#84a98c', // 10px light greeen circles when point count is less than 10
                10,
                '#52796f', // 20px green circles when point count is between 10 and 30
                30,
                '#354f52', // 30px dark green circles when point count is between 10 and 30
                50,
                '#2f3e46' // 40px darker green circles when point count is greater than or equal to 50
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                10,
                10,
                20,
                30,
                30,
                50,
                40
            ]
        }
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'campgrounds',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'campgrounds',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#84a98c',
            'circle-radius': 4,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#84a98c'
        }
    });

    map.on('click', 'clusters', function (e) { // inspect a cluster on click
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('campgrounds').getClusterExpansionZoom(
            clusterId,
            function (err, zoom) {
                if (err) return;
                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
    });


    map.on('click', 'unclustered-point', function (e) { // When a click event occurs on a feature in the unclustered-point layer, open a popup at the location of the feature, with description HTML from its properties.
        const { popUpMarkup } = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates.slice();
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) { // Ensure that if the map is zoomed out such that multiple copies of the feature are visible, the popup appears over the copy being pointed to.
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popUpMarkup)
            .addTo(map);
    });

    map.on('mouseenter', 'clusters', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'clusters', function () {
        map.getCanvas().style.cursor = '';
    });
});