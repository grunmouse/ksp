// Generated by CoffeeScript 1.3.3
(function() {
  var GOLDEN_RATIO, HALF_PI, Orbit, TWO_PI, acosh, binarySearch, circularToHyperbolicDeltaV, cosh, crossProduct, ejectionAngle, gaussTimeOfFlight, goldenSectionSearch, newtonsMethod, normalize, projectToPlane, sinh, transferVelocities;

  TWO_PI = 2 * Math.PI;

  HALF_PI = 0.5 * Math.PI;

  GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

  sinh = function(angle) {
    var p;
    p = Math.exp(angle);
    return (p - (1 / p)) * 0.5;
  };

  cosh = function(angle) {
    var p;
    p = Math.exp(angle);
    return (p + (1 / p)) * 0.5;
  };

  acosh = function(n) {
    return Math.log(n + Math.sqrt(n * n - 1));
  };

  crossProduct = function(a, b) {
    var r;
    r = new Array(3);
    r[0] = a[1] * b[2] - a[2] * b[1];
    r[1] = a[2] * b[0] - a[0] * b[2];
    r[2] = a[0] * b[1] - a[1] * b[0];
    return r;
  };

  normalize = function(v) {
    return numeric.divVS(v, numeric.norm2(v));
  };

  projectToPlane = function(p, n) {
    return numeric.subVV(p, numeric.mulSV(numeric.dot(p, n), n));
  };

  goldenSectionSearch = function(x1, x2, f) {
    var k, x, x3, y, y2;
    k = 2 - GOLDEN_RATIO;
    x3 = x2;
    x2 = x1 + k * (x3 - x1);
    y2 = f(x2);
    while (true) {
      if ((x3 - x2) > (x2 - x1)) {
        x = x2 + k * (x3 - x2);
      } else {
        x = x2 - k * (x2 - x1);
      }
      if ((x3 - x1) < (1e-2 * (x2 + x))) {
        return (x3 + x1) / 2;
      }
      y = f(x);
      if (y < y2) {
        if ((x3 - x2) > (x2 - x1)) {
          x1 = x2;
        } else {
          x3 = x2;
        }
        x2 = x;
        y2 = y;
      } else {
        if ((x3 - x2) > (x2 - x1)) {
          x3 = x;
        } else {
          x1 = x;
        }
      }
    }
  };

  binarySearch = function(x1, x2, value, f) {
    var x, y;
    while (true) {
      x = (x1 + x2) / 2;
      if (x === x1 || x === x2) {
        return x;
      }
      y = f(x);
      if (Math.abs(1 - y / value) < 1e-6) {
        return x;
      }
      if (y < value) {
        x2 = x;
      } else {
        x1 = x;
      }
    }
  };

  newtonsMethod = function(x0, f, df) {
    var x;
    while (true) {
      x = x0 - f(x0) / df(x0);
      if (isNaN(x) || Math.abs(x - x0) < 1e-6) {
        return x;
      }
      x0 = x;
    }
  };

  (typeof exports !== "undefined" && exports !== null ? exports : this).Orbit = Orbit = (function() {

    function Orbit(referenceBody, semiMajorAxis, eccentricity, inclination, longitudeOfAscendingNode, argumentOfPeriapsis, meanAnomalyAtEpoch) {
      this.referenceBody = referenceBody;
      this.semiMajorAxis = semiMajorAxis;
      this.eccentricity = eccentricity;
      this.meanAnomalyAtEpoch = meanAnomalyAtEpoch;
      if (inclination != null) {
        this.inclination = inclination * Math.PI / 180;
      }
      if (longitudeOfAscendingNode != null) {
        this.longitudeOfAscendingNode = longitudeOfAscendingNode * Math.PI / 180;
      }
      if (argumentOfPeriapsis != null) {
        this.argumentOfPeriapsis = argumentOfPeriapsis * Math.PI / 180;
      }
      if (this.isHyperbolic()) {
        this.timeOfPeriapsisPassage = this.meanAnomalyAtEpoch;
        delete this.meanAnomalyAtEpoch;
      }
    }

    Orbit.prototype.isHyperbolic = function() {
      return this.eccentricity > 1;
    };

    Orbit.prototype.apoapsis = function() {
      return this.semiMajorAxis * (1 + this.eccentricity);
    };

    Orbit.prototype.periapsis = function() {
      return this.semiMajorAxis * (1 - this.eccentricity);
    };

    Orbit.prototype.apoapsisAltitude = function() {
      return this.apoapsis() - this.referenceBody.radius;
    };

    Orbit.prototype.periapsisAltitude = function() {
      return this.periapsis() - this.referenceBody.radius;
    };

    Orbit.prototype.semiMinorAxis = function() {
      var e;
      e = this.eccentricity;
      return this.semiMajorAxis * Math.sqrt(1 - e * e);
    };

    Orbit.prototype.semiLatusRectum = function() {
      var e;
      e = this.eccentricity;
      return this.semiMajorAxis * (1 - e * e);
    };

    Orbit.prototype.meanMotion = function() {
      var a;
      a = Math.abs(this.semiMajorAxis);
      return Math.sqrt(this.referenceBody.gravitationalParameter / (a * a * a));
    };

    Orbit.prototype.period = function() {
      if (this.isHyperbolic()) {
        return Infinity;
      } else {
        return TWO_PI / this.meanMotion();
      }
    };

    Orbit.prototype.rotationToReferenceFrame = function() {
      var axisOfInclination;
      axisOfInclination = [Math.cos(-this.argumentOfPeriapsis), Math.sin(-this.argumentOfPeriapsis), 0];
      return quaternion.concat(quaternion.fromAngleAxis(this.longitudeOfAscendingNode + this.argumentOfPeriapsis, [0, 0, 1]), quaternion.fromAngleAxis(this.inclination, axisOfInclination));
    };

    Orbit.prototype.normalVector = function() {
      return quaternion.rotate(this.rotationToReferenceFrame(), [0, 0, 1]);
    };

    Orbit.prototype.phaseAngle = function(orbit, t) {
      var n, p1, p2, phaseAngle, r1, r2;
      n = this.normalVector();
      p1 = this.positionAtTrueAnomaly(this.trueAnomalyAt(t));
      p2 = orbit.positionAtTrueAnomaly(orbit.trueAnomalyAt(t));
      p2 = numeric.subVV(p2, numeric.mulVS(n, numeric.dot(p2, n)));
      r1 = numeric.norm2(p1);
      r2 = numeric.norm2(p2);
      phaseAngle = Math.acos(numeric.dot(p1, p2) / (r1 * r2));
      if (numeric.dot(crossProduct(p1, p2), n) < 0) {
        phaseAngle = TWO_PI - phaseAngle;
      }
      if (orbit.semiMajorAxis < this.semiMajorAxis) {
        phaseAngle = phaseAngle - TWO_PI;
      }
      return phaseAngle;
    };

    Orbit.prototype.meanAnomalyAt = function(t) {
      if (this.isHyperbolic()) {
        return (t - this.timeOfPeriapsisPassage) * this.meanMotion();
      } else {
        return (this.meanAnomalyAtEpoch + this.meanMotion() * (t % this.period())) % TWO_PI;
      }
    };

    Orbit.prototype.eccentricAnomalyAt = function(t) {
      var M, e;
      e = this.eccentricity;
      M = this.meanAnomalyAt(t);
      if (this.isHyperbolic()) {
        return newtonsMethod(M, function(x) {
          return M - e * sinh(x) + x;
        }, function(x) {
          return 1 - e * cosh(x);
        });
      } else {
        return newtonsMethod(M, function(x) {
          return M + e * Math.sin(x) - x;
        }, function(x) {
          return e * Math.cos(x) - 1;
        });
      }
    };

    Orbit.prototype.trueAnomalyAt = function(t) {
      var E, H, e, tA;
      e = this.eccentricity;
      if (this.isHyperbolic()) {
        H = this.eccentricAnomalyAt(t);
        tA = Math.acos((e - cosh(H)) / (cosh(H) * e - 1));
        if (H < 0) {
          return -tA;
        } else {
          return tA;
        }
      } else {
        E = this.eccentricAnomalyAt(t);
        tA = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
        if (tA < 0) {
          return tA + TWO_PI;
        } else {
          return tA;
        }
      }
    };

    Orbit.prototype.eccentricAnomalyAtTrueAnomaly = function(tA) {
      var E, H, cosTrueAnomaly, e;
      e = this.eccentricity;
      if (this.isHyperbolic()) {
        cosTrueAnomaly = Math.cos(tA);
        H = acosh((e + cosTrueAnomaly) / (1 + e * cosTrueAnomaly));
        if (tA < 0) {
          return -H;
        } else {
          return H;
        }
      } else {
        E = 2 * Math.atan(Math.tan(tA / 2) / Math.sqrt((1 + e) / (1 - e)));
        if (E < 0) {
          return E + TWO_PI;
        } else {
          return E;
        }
      }
    };

    Orbit.prototype.meanAnomalyAtTrueAnomaly = function(tA) {
      var E, H, e;
      e = this.eccentricity;
      if (this.isHyperbolic()) {
        H = this.eccentricAnomalyAtTrueAnomaly(tA);
        return e * sinh(H) - H;
      } else {
        E = this.eccentricAnomalyAtTrueAnomaly(tA);
        return E - e * Math.sin(E);
      }
    };

    Orbit.prototype.timeAtTrueAnomaly = function(tA, t0) {
      var M, p, t;
      if (t0 == null) {
        t0 = 0;
      }
      M = this.meanAnomalyAtTrueAnomaly(tA);
      if (this.isHyperbolic()) {
        return this.timeOfPeriapsisPassage + M / this.meanMotion();
      } else {
        p = this.period();
        t = (t0 - (t0 % p)) + (M - this.meanAnomalyAtEpoch) / this.meanMotion();
        if (t < t0) {
          return t + p;
        } else {
          return t;
        }
      }
    };

    Orbit.prototype.radiusAtTrueAnomaly = function(tA) {
      var e;
      e = this.eccentricity;
      return this.semiMajorAxis * (1 - e * e) / (1 + e * Math.cos(tA));
    };

    Orbit.prototype.altitudeAtTrueAnomaly = function(tA) {
      return this.radiusAtTrueAnomaly(tA) - this.referenceBody.radius;
    };

    Orbit.prototype.speedAtTrueAnomaly = function(tA) {
      return Math.sqrt(this.referenceBody.gravitationalParameter * (2 / this.radiusAtTrueAnomaly(tA) - 1 / this.semiMajorAxis));
    };

    Orbit.prototype.positionAtTrueAnomaly = function(tA) {
      var r;
      r = this.radiusAtTrueAnomaly(tA);
      return quaternion.rotate(this.rotationToReferenceFrame(), [r * Math.cos(tA), r * Math.sin(tA), 0]);
    };

    Orbit.prototype.velocityAtTrueAnomaly = function(tA) {
      var cos, e, h, mu, r, sin, vr, vtA;
      mu = this.referenceBody.gravitationalParameter;
      e = this.eccentricity;
      h = Math.sqrt(mu * this.semiMajorAxis * (1 - e * e));
      r = this.radiusAtTrueAnomaly(tA);
      sin = Math.sin(tA);
      cos = Math.cos(tA);
      vr = mu * e * sin / h;
      vtA = h / r;
      return quaternion.rotate(this.rotationToReferenceFrame(), [vr * cos - vtA * sin, vr * sin + vtA * cos, 0]);
    };

    Orbit.prototype.trueAnomalyAtPosition = function(p) {
      p = quaternion.rotate(quaternion.conjugate(this.rotationToReferenceFrame()), p);
      return Math.atan2(p[1], p[0]);
    };

    return Orbit;

  })();

  Orbit.fromJSON = function(json) {
    var result;
    result = new Orbit(json.referenceBody, json.semiMajorAxis, json.eccentricity);
    result.inclination = json.inclination;
    result.longitudeOfAscendingNode = json.longitudeOfAscendingNode;
    result.argumentOfPeriapsis = json.argumentOfPeriapsis;
    result.meanAnomalyAtEpoch = json.meanAnomalyAtEpoch;
    return result;
  };

  Orbit.fromApoapsisAndPeriapsis = function(referenceBody, apoapsis, periapsis, inclination, longitudeOfAscendingNode, argumentOfPeriapsis, meanAnomalyAtEpoch) {
    var eccentricity, semiMajorAxis, _ref;
    if (apoapsis < periapsis) {
      _ref = [periapsis, apoapsis], apoapsis = _ref[0], periapsis = _ref[1];
    }
    semiMajorAxis = (apoapsis + periapsis) / 2;
    eccentricity = apoapsis / semiMajorAxis - 1;
    return new Orbit(referenceBody, semiMajorAxis, eccentricity, inclination, longitudeOfAscendingNode, argumentOfPeriapsis, meanAnomalyAtEpoch);
  };

  Orbit.fromAltitudeAndSpeed = function(referenceBody, altitude, speed, flightPathAngle, heading, latitude, longitude, t) {
    var cosPhi, e, eccentricity, equatorialAngleToAscendingNode, meanAnomaly, mu, orbit, orbitalAngleToAscendingNode, radius, semiMajorAxis, sinPhi, trueAnomaly;
    radius = referenceBody.radius + altitude;
    flightPathAngle = flightPathAngle * Math.PI / 180;
    if (heading != null) {
      heading = heading * Math.PI / 180;
    }
    if (latitude != null) {
      latitude = latitude * Math.PI / 180;
    }
    if (longitude != null) {
      longitude = longitude * Math.PI / 180;
    }
    mu = referenceBody.gravitationalParameter;
    sinPhi = Math.sin(flightPathAngle);
    cosPhi = Math.cos(flightPathAngle);
    semiMajorAxis = 1 / (2 / radius - speed * speed / mu);
    eccentricity = Math.sqrt(Math.pow(radius * speed * speed / mu - 1, 2) * cosPhi * cosPhi + sinPhi * sinPhi);
    orbit = new Orbit(referenceBody, semiMajorAxis, eccentricity, 0, 0, 0, 0);
    e = eccentricity;
    trueAnomaly = Math.acos((this.semiMajorAxis * (1 - e * e) / radius - 1) / e);
    if (flightPathAngle < 0) {
      trueAnomaly = TWO_PI - trueAnomaly;
    }
    meanAnomaly = orbit.meanAnomalyAtTrueAnomaly(trueAnomaly);
    orbit.meanAnomalyAtEpoch = meanAnomaly - orbit.meanMotion() * (t % orbit.period());
    if ((heading != null) && (latitude != null)) {
      orbit.inclination = Math.acos(Math.cos(latitude) * Math.sin(heading));
      orbitalAngleToAscendingNode = Math.atan2(Math.tan(latitude), Math.cos(heading));
      orbit.argumentOfPeriapsis = orbitalAngleToAscendingNode - trueAnomaly;
      if (longitude != null) {
        equatorialAngleToAscendingNode = Math.atan2(Math.sin(latitude) * Math.sin(heading), Math.cos(heading));
        orbit.longitudeOfAscendingNode = referenceBody.siderealTimeAt(longitude - equatorialAngleToAscendingNode, t);
      }
    }
    return orbit;
  };

  Orbit.fromPositionAndVelocity = function(referenceBody, position, velocity, t) {
    var eccentricity, eccentricityVector, meanAnomaly, mu, nodeVector, orbit, r, semiMajorAxis, specificAngularMomentum, trueAnomaly, v;
    mu = referenceBody.gravitationalParameter;
    r = numeric.norm2(position);
    v = numeric.norm2(velocity);
    specificAngularMomentum = crossProduct(position, velocity);
    if (specificAngularMomentum[0] !== 0 || specificAngularMomentum[1] !== 0) {
      nodeVector = normalize([-specificAngularMomentum[1], specificAngularMomentum[0], 0]);
    } else {
      nodeVector = [1, 0, 0];
    }
    eccentricityVector = numeric.mulSV(1 / mu, numeric.subVV(numeric.mulSV(v * v - mu / r, position), numeric.mulSV(numeric.dot(position, velocity), velocity)));
    semiMajorAxis = 1 / (2 / r - v * v / mu);
    eccentricity = numeric.norm2(eccentricityVector);
    orbit = new Orbit(referenceBody, semiMajorAxis, eccentricity);
    orbit.inclination = Math.acos(specificAngularMomentum[2] / numeric.norm2(specificAngularMomentum));
    if (eccentricity === 0) {
      orbit.argumentOfPeriapsis = 0;
      orbit.longitudeOfAscendingNode = 0;
    } else {
      orbit.longitudeOfAscendingNode = Math.acos(nodeVector[0]);
      if (nodeVector[1] < 0) {
        orbit.longitudeOfAscendingNode = TWO_PI - orbit.longitudeOfAscendingNode;
      }
      orbit.argumentOfPeriapsis = Math.acos(numeric.dot(nodeVector, eccentricityVector) / eccentricity);
      if (eccentricityVector[2] < 0) {
        orbit.argumentOfPeriapsis = TWO_PI - orbit.argumentOfPeriapsis;
      }
    }
    trueAnomaly = Math.acos(numeric.dot(eccentricityVector, position) / (eccentricity * r));
    if (numeric.dot(position, velocity) < 0) {
      trueAnomaly = -trueAnomaly;
    }
    meanAnomaly = orbit.meanAnomalyAtTrueAnomaly(trueAnomaly);
    if (orbit.isHyperbolic()) {
      orbit.timeOfPeriapsisPassage = t - meanAnomaly / orbit.meanMotion();
    } else {
      orbit.meanAnomalyAtEpoch = meanAnomaly - orbit.meanMotion() * (t % orbit.period());
    }
    return orbit;
  };

  Orbit.circularToHyperbolicDeltaV = circularToHyperbolicDeltaV = function(v0, vinf, relativeInclination) {
    var v1;
    v1 = Math.sqrt(vinf * vinf + 2 * v0 * v0);
    if (relativeInclination) {
      return Math.sqrt(v0 * v0 + v1 * v1 - 2 * v0 * v1 * Math.cos(relativeInclination));
    } else {
      return v1 - v0;
    }
  };

  gaussTimeOfFlight = function(mu, r1, r2, deltaNu, k, l, m, p) {
    var a, dE, dF, df, f, g, sinDeltaE;
    a = m * k * p / ((2 * m - l * l) * p * p + 2 * k * l * p - k * k);
    f = 1 - r2 / p * (1 - Math.cos(deltaNu));
    g = r1 * r2 * Math.sin(deltaNu) / Math.sqrt(mu * p);
    df = Math.sqrt(mu / p) * Math.tan(deltaNu / 2) * ((1 - Math.cos(deltaNu)) / p - 1 / r1 - 1 / r2);
    if (a > 0) {
      dE = Math.acos(1 - r1 / a * (1 - f));
      sinDeltaE = -r1 * r2 * df / Math.sqrt(mu * a);
      if (sinDeltaE < 0) {
        dE = TWO_PI - dE;
      }
      return g + Math.sqrt(a * a * a / mu) * (dE - sinDeltaE);
    } else {
      dF = acosh(1 - r1 / a * (1 - f));
      return g + Math.sqrt(-a * a * a / mu) * (sinh(dF) - dF);
    }
  };

  transferVelocities = function(mu, position1, position2, dt, longWay) {
    var a, cosDeltaNu, deltaNu, df, dg, f, g, k, l, m, p, p0, p1, r1, r2, t0, t1, v1, v2;
    r1 = numeric.norm2(position1);
    r2 = numeric.norm2(position2);
    cosDeltaNu = numeric.dot(position1, position2) / (r1 * r2);
    deltaNu = Math.acos(cosDeltaNu);
    if (longWay) {
      deltaNu = TWO_PI - deltaNu;
    }
    if (Math.abs(cosDeltaNu) === 1) {
      throw new Error("Unable find orbit between collinear points");
    }
    k = r1 * r2 * (1 - cosDeltaNu);
    l = r1 + r2;
    m = r1 * r2 * (1 + cosDeltaNu);
    if (longWay) {
      p0 = k / (l - Math.sqrt(2 * m));
      p1 = p0 * 1e-3;
      p0 *= 0.999999;
    } else {
      p0 = k / (l + Math.sqrt(2 * m));
      p1 = p0 * 1e3;
      p0 *= 1.000001;
    }
    t0 = gaussTimeOfFlight(mu, r1, r2, deltaNu, k, l, m, p0);
    t1 = gaussTimeOfFlight(mu, r1, r2, deltaNu, k, l, m, p1);
    if (t0 < dt) {
      p = p0;
    } else if (t1 > dt) {
      p = p1;
    } else {
      p = binarySearch(p0, p1, dt, function(p) {
        return gaussTimeOfFlight(mu, r1, r2, deltaNu, k, l, m, p);
      });
    }
    a = m * k * p / ((2 * m - l * l) * p * p + 2 * k * l * p - k * k);
    f = 1 - r2 / p * (1 - cosDeltaNu);
    g = r1 * r2 * Math.sin(deltaNu) / Math.sqrt(mu * p);
    df = Math.sqrt(mu / p) * Math.tan(deltaNu / 2) * ((1 - cosDeltaNu) / p - 1 / r1 - 1 / r2);
    dg = 1 - r1 / p * (1 - cosDeltaNu);
    v1 = numeric.mulVS(numeric.subVV(position2, numeric.mulVS(position1, f)), 1 / g);
    v2 = numeric.addVV(numeric.mulVS(position1, df), numeric.mulVS(v1, dg));
    return [v1, v2];
  };

  ejectionAngle = function(asymptote, eccentricity, normal, prograde) {
    var a, ax, ay, az, b, c, e, f, g, h, nx, ny, nz, vx, vy, vz, _ref;
    e = eccentricity;
    _ref = normalize(asymptote), ax = _ref[0], ay = _ref[1], az = _ref[2];
    nx = normal[0], ny = normal[1], nz = normal[2];
    f = ay - az * ny / nz;
    g = (az * nx - ax * nz) / (ay * nz - az * ny);
    h = (nx + g * ny) / nz;
    a = 1 + g * g + h * h;
    b = -2 * (g * (ny * ny + nz * nz) + nx * ny) / (e * f * nz * nz);
    c = (nz * nz + ny * ny) / (e * e * f * f * nz * nz) - 1;
    vx = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
    vy = g * vx - 1 / (e * f);
    vz = -(vx * nx + vy * ny) / nz;
    if (numeric.dot(crossProduct([vx, vy, vz], [ax, ay, az]), normal) < 0) {
      vx = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      vy = g * vx - 1 / (e * f);
      vz = -(vx * nx + vy * ny) / nz;
    }
    if (numeric.dot(crossProduct([vx, vy, vz], prograde), normal) < 0) {
      return TWO_PI - Math.acos(numeric.dot([vx, vy, vz], prograde));
    } else {
      return Math.acos(numeric.dot([vx, vy, vz], prograde));
    }
  };

  Orbit.transfer = function(transferType, referenceBody, t0, p0, v0, n0, t1, p1, v1, n1, initialOrbitalVelocity, finalOrbitalVelocity, originBody, planeChangeAngleToIntercept) {
    var ballisticTransfer, dt, e, ejectionDeltaV, ejectionDeltaVector, ejectionInclination, ejectionVelocity, insertionDeltaV, insertionDeltaVector, insertionInclination, insertionVelocity, longTransfer, mu, orbit, p1InOriginPlane, planeChangeAngle, planeChangeAxis, planeChangeDeltaV, planeChangeRotation, planeChangeTime, planeChangeTransfer, planeChangeTrueAnomaly, r, relativeInclination, shortTransfer, transfer, transferAngle, trueAnomalyAtIntercept, v, v1InOriginPlane, x, x1, x2, _i, _len, _ref, _ref1, _ref2, _ref3;
    if (transferType === "optimal") {
      ballisticTransfer = Orbit.transfer("ballistic", referenceBody, t0, p0, v0, n0, t1, p1, v1, n1, initialOrbitalVelocity, finalOrbitalVelocity, originBody);
      if (ballisticTransfer.angle <= HALF_PI) {
        return ballisticTransfer;
      }
      planeChangeTransfer = Orbit.transfer("optimalPlaneChange", referenceBody, t0, p0, v0, n0, t1, p1, v1, n1, initialOrbitalVelocity, finalOrbitalVelocity, originBody);
      if (ballisticTransfer.deltaV < planeChangeTransfer.deltaV) {
        return ballisticTransfer;
      } else {
        return planeChangeTransfer;
      }
    } else if (transferType === "optimalPlaneChange") {
      if (numeric.norm2(p0) > numeric.norm2(p1)) {
        x1 = HALF_PI;
        x2 = Math.PI;
      } else {
        x1 = 0;
        x2 = HALF_PI;
      }
      relativeInclination = Math.asin(numeric.dot(p1, n0) / numeric.norm2(p1));
      planeChangeRotation = quaternion.fromAngleAxis(-relativeInclination, crossProduct(p1, n0));
      p1InOriginPlane = quaternion.rotate(planeChangeRotation, p1);
      v1InOriginPlane = quaternion.rotate(planeChangeRotation, v1);
      ballisticTransfer = Orbit.transfer("ballistic", referenceBody, t0, p0, v0, n0, t1, p1InOriginPlane, v1InOriginPlane, n0, initialOrbitalVelocity, finalOrbitalVelocity, originBody);
      orbit = Orbit.fromPositionAndVelocity(referenceBody, p0, ballisticTransfer.ejectionVelocity, t0);
      trueAnomalyAtIntercept = orbit.trueAnomalyAtPosition(p1InOriginPlane);
      x = goldenSectionSearch(x1, x2, function(x) {
        var planeChangeAngle;
        planeChangeAngle = Math.atan2(Math.tan(relativeInclination), Math.sin(x));
        return Math.abs(2 * orbit.speedAtTrueAnomaly(trueAnomalyAtIntercept - x) * Math.sin(planeChangeAngle / 2));
      });
      return Orbit.transfer("planeChange", referenceBody, t0, p0, v0, n0, t1, p1, v1, n1, initialOrbitalVelocity, finalOrbitalVelocity, originBody, x);
    } else if (transferType === "planeChange") {
      if (planeChangeAngleToIntercept == null) {
        planeChangeAngleToIntercept = HALF_PI;
      }
      relativeInclination = Math.asin(numeric.dot(p1, n0) / numeric.norm2(p1));
      planeChangeAngle = Math.atan2(Math.tan(relativeInclination), Math.sin(planeChangeAngleToIntercept));
      if (planeChangeAngle !== 0) {
        planeChangeAxis = quaternion.rotate(quaternion.fromAngleAxis(-planeChangeAngleToIntercept, n0), projectToPlane(p1, n0));
        planeChangeRotation = quaternion.fromAngleAxis(planeChangeAngle, planeChangeAxis);
        p1InOriginPlane = quaternion.rotate(quaternion.conjugate(planeChangeRotation), p1);
      }
    }
    dt = t1 - t0;
    shortTransfer = {};
    longTransfer = {};
    _ref = [shortTransfer, longTransfer];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      transfer = _ref[_i];
      transferAngle = Math.acos(numeric.dot(p0, p1) / (numeric.norm2(p0) * numeric.norm2(p1)));
      if (transfer === longTransfer) {
        transferAngle = TWO_PI - transferAngle;
      }
      if (!planeChangeAngle || transferAngle <= HALF_PI) {
        _ref1 = transferVelocities(referenceBody.gravitationalParameter, p0, p1, dt, transfer === longTransfer), ejectionVelocity = _ref1[0], insertionVelocity = _ref1[1];
        planeChangeDeltaV = 0;
      } else {
        _ref2 = transferVelocities(referenceBody.gravitationalParameter, p0, p1InOriginPlane, dt, transfer === longTransfer), ejectionVelocity = _ref2[0], insertionVelocity = _ref2[1];
        orbit = Orbit.fromPositionAndVelocity(referenceBody, p0, ejectionVelocity, t0);
        planeChangeTrueAnomaly = orbit.trueAnomalyAt(t1) - planeChangeAngleToIntercept;
        planeChangeDeltaV = Math.abs(2 * orbit.speedAtTrueAnomaly(planeChangeTrueAnomaly) * Math.sin(planeChangeAngle / 2));
        if (isNaN(planeChangeDeltaV)) {
          planeChangeDeltaV = 0;
        }
        planeChangeTime = orbit.timeAtTrueAnomaly(planeChangeTrueAnomaly, t0);
        insertionVelocity = quaternion.rotate(planeChangeRotation, insertionVelocity);
      }
      ejectionDeltaVector = numeric.subVV(ejectionVelocity, v0);
      ejectionDeltaV = numeric.norm2(ejectionDeltaVector);
      ejectionInclination = Math.asin(numeric.dot(ejectionDeltaVector, n0) / ejectionDeltaV);
      if (initialOrbitalVelocity) {
        ejectionDeltaV = circularToHyperbolicDeltaV(initialOrbitalVelocity, ejectionDeltaV, ejectionInclination);
      }
      if (finalOrbitalVelocity != null) {
        insertionDeltaVector = numeric.subVV(insertionVelocity, v1);
        insertionDeltaV = numeric.norm2(insertionDeltaVector);
        insertionInclination = Math.asin(numeric.dot(insertionDeltaVector, n1) / insertionDeltaV);
        if (finalOrbitalVelocity) {
          insertionDeltaV = circularToHyperbolicDeltaV(finalOrbitalVelocity, insertionDeltaV, 0);
        }
      } else {
        insertionDeltaV = 0;
      }
      transfer.angle = transferAngle;
      transfer.orbit = orbit;
      transfer.ejectionVelocity = ejectionVelocity;
      transfer.ejectionDeltaVector = ejectionDeltaVector;
      transfer.ejectionInclination = ejectionInclination;
      transfer.ejectionDeltaV = ejectionDeltaV;
      transfer.planeChangeAngleToIntercept = planeChangeAngleToIntercept;
      transfer.planeChangeDeltaV = planeChangeDeltaV;
      transfer.planeChangeTime = planeChangeTime;
      transfer.planeChangeAngle = planeChangeTime != null ? planeChangeAngle : 0;
      transfer.insertionVelocity = insertionVelocity;
      transfer.insertionInclination = insertionInclination;
      transfer.insertionDeltaV = insertionDeltaV;
      transfer.deltaV = ejectionDeltaV + planeChangeDeltaV + insertionDeltaV;
    }
    transfer = shortTransfer.deltaV < longTransfer.deltaV ? shortTransfer : longTransfer;
    if (originBody) {
      mu = originBody.gravitationalParameter;
      r = mu / (initialOrbitalVelocity * initialOrbitalVelocity);
      v = initialOrbitalVelocity + transfer.ejectionDeltaV;
      e = r * v * v / mu - 1;
      transfer.ejectionAngle = ejectionAngle(transfer.ejectionDeltaVector, e, n0, normalize(v0));
      if ((_ref3 = transfer.orbit) == null) {
        transfer.orbit = Orbit.fromPositionAndVelocity(referenceBody, p0, transfer.ejectionVelocity, t0);
      }
    }
    return transfer;
  };

}).call(this);
