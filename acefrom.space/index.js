// http://www.stjarnhimlen.se/comp/ppcomp.html

function get_d() {
    var timeInMs = Date.now() / 1000;
    // January 1, 2000 12:00:00 AM
    var epoch = 946684800;
    // seconds in a day
    return (timeInMs - epoch) / 86400.0;
}

function get_ut(d) {
    return (d % 1) * 24;
}

function sun_earth(d) {
    return {
        N: 0.0,
        i: 0.0,
        w: 282.9404 + 4.70935E-5 * d,
        a: 1.0,
        e: 0.016709 - 1.151E-9 * d,
        M: 356.0470 + 0.9856002585 * d,
    };
}

function mercury(d) {
    return {
        N: 48.3313 + 3.24587E-5 * d,
        i: 7.0047 + 5.00E-8 * d,
        w: 29.1241 + 1.01444E-5 * d,
        a: 0.387098,
        e: 0.205635 + 5.59E-10 * d,
        M: 168.6562 + 4.0923344368 * d,
    };
}

function venus(d) {
    return {
        N: 76.6799 + 2.46590E-5 * d,
        i: 3.3946 + 2.75E-8 * d,
        w: 54.8910 + 1.38374E-5 * d,
        a: 0.723330,
        e: 0.006773 - 1.302E-9 * d,
        M: 48.0052 + 1.6021302244 * d,
    };
}

function mars(d) {
    return {
        N: 49.5574 + 2.11081E-5 * d,
        i: 1.8497 - 1.78E-8 * d,
        w: 286.5016 + 2.92961E-5 * d,
        a: 1.523688,
        e: 0.093405 + 2.516E-9 * d,
        M: 18.6021 + 0.5240207766 * d,
    };
}

function jupiter(d) {
    return {
        N: 100.4542 + 2.76854E-5 * d,
        i: 1.3030 - 1.557E-7 * d,
        w: 273.8777 + 1.64505E-5 * d,
        a: 5.20256,
        e: 0.048498 + 4.469E-9 * d,
        M: 19.8950 + 0.0830853001 * d,
    };
}

function saturn(d) {
    return {
        N: 113.6634 + 2.38980E-5 * d,
        i: 2.4886 - 1.081E-7 * d,
        w: 339.3939 + 2.97661E-5 * d,
        a: 9.55475,
        e: 0.055546 - 9.499E-9 * d,
        M: 316.9670 + 0.0334442282 * d,
    };
}

function uranus(d) {
    return {
        N: 74.0005 + 1.3978E-5 * d,
        i: 0.7733 + 1.9E-8 * d,
        w: 96.6612 + 3.0565E-5 * d,
        a: 19.18171 - 1.55E-8 * d,
        e: 0.047318 + 7.45E-9 * d,
        M: 142.5905 + 0.011725806 * d,
    };
}

function neptune(d) {
    return {
        N: 131.7806 + 3.0173E-5 * d,
        i: 1.7700 - 2.55E-7 * d,
        w: 272.8461 - 6.027E-6 * d,
        a: 30.05826 + 3.313E-8 * d,
        e: 0.008606 + 2.15E-9 * d,
        M: 260.2471 + 0.005995147 * d,
    };
}

function sin(x) {
    return Math.sin(x * (Math.PI / 180));
}

function cos(x) {
    return Math.cos(x * (Math.PI / 180));
}

function asin(x) {
    return Math.asin(x) * (180 / Math.PI);
}

function acos(x) {
    return Math.acos(x) * (180 / Math.PI);
}

function atan2(y, x) {
    return Math.atan2(y, x) * (180 / Math.PI);
}

function sun_stuff(d) {
    let params = sun_earth(d);
    let E = params.M + params.e * (180 / Math.PI) * sin(params.M) * (1.0 + params.e * cos(params.M));
    let xv = cos(E) - params.e;
    let yv = Math.sqrt(1.0 - params.e * params.e) * sin(E);
    let v = atan2(yv, xv);
    return v + params.w;
}

function get_lst(d, local_longitude) {
    let Ls = sun_stuff(d);
    let GMST0 = (Ls + 180) / 15;
    let GMST = GMST0 + get_ut(d);
    let LST = GMST + local_longitude / 15;
    console.log("LST: " + LST);
    return LST;
}

function iter_E(E, e, M) {
    return E - (E - e * sin(E) - M) / (1 - e * cos(E));
}

function calculate(params) {
    let E = params.M + params.e * (180 / Math.PI) * sin(params.M) * (1.0 + params.e * cos(params.M));
    // TODO
    // E = iter_E(E, params.e, params.M);
    // E = iter_E(E, params.e, params.M);
    // E = iter_E(E, params.e, params.M);

    let xv = params.a * (cos(E) - params.e);
    let yv = params.a * (Math.sqrt(1.0 - params.e * params.e) * sin(E));

    let v = atan2(yv, xv);
    let r = Math.sqrt(xv * xv + yv * yv);

    let xh = r * (cos(params.N) * cos(v + params.w) - sin(params.N) * sin(v + params.w) * cos(params.i));
    let yh = r * (sin(params.N) * cos(v + params.w) + cos(params.N) * sin(v + params.w) * cos(params.i));
    let zh = r * (sin(v + params.w) * sin(params.i));

    return {
        x: xh,
        y: yh,
        z: zh,
    };
}

function figure(earth, other, d, local_longitude) {
    let xg = other.x + earth.x;
    let yg = other.y + earth.y;
    let zg = other.z + earth.z;
    let ecl = 23.4393 - 3.563E-7 * d;
    let xe = xg;
    let ye = yg * cos(ecl) - zg * sin(ecl);
    let ze = yg * sin(ecl) + zg * cos(ecl);
    let RA = atan2(ye, xe);
    let Dec = atan2(ze, Math.sqrt(xe * xe + ye * ye));

    let LST = get_lst(d, local_longitude) * (360 / 24);
    let HA = LST - RA;
    while (HA < -180) {
        HA += 360;
    }
    while (HA > 180) {
        HA -= 360;
    }

    // let lat = 47.6062;
    // let Decl = atan2(ze, Math.sqrt(xe * xe + ye * ye));

    // let x = cos(HA) * cos(Decl);
    // let y = sin(HA) * cos(Decl);
    // let z = sin(Decl);

    // let xhor = x * sin(lat) - z * cos(lat);
    // let yhor = y;
    // let zhor = x * cos(lat) + z * sin(lat);

    // let az = atan2(yhor, xhor) + 180;
    // let alt = atan2(zhor, Math.sqrt(xhor * xhor + yhor * yhor));

    // console.log("41.393" + ", " + "225.829");
    // console.log(alt + ", " + az);
    // console.log((10 / 24 + 55 / (24 * 60) + 20 / (24 * 60 * 60)) * 360   + "   Dec. +   7° 50' 02");
    // console.log(RA + ", " + Dec);
    // let rg = Math.sqrt(xg * xg + yg * yg + zg * zg);// = sqrt(xe * xe + ye * ye + ze * ze);
    // console.log(rg);

    return HA;
}

function acefromspace_onload() {
    let planets = [mercury, venus, mars, jupiter, saturn, uranus, neptune];
    let names = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"];
    let d = get_d();
    let sun_earth_result = calculate(sun_earth(d));
    let results = document.getElementById("results");
    for (let i = 0; i < planets.length; i++) {
        let result = figure(sun_earth_result, calculate(planets[i](d)), d, -122.33);
        console.log(names[i] + " = " + result);
        let text = document.createTextNode(names[i]);
        let container = document.createElement("div");
        container.classList += "verticalLine";
        container.style.marginLeft = (result + 180) / 360 * 100 + "%";
        container.appendChild(text);
        results.appendChild(container);
    }
}

acefromspace_onload();