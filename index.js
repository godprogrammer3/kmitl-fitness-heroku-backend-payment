const express = require("express");
const cors = require("cors");
const app = express();
var bodyParser = require("body-parser");

var omise = require("omise")({
  secretKey: "skey_test_5jidn0btt7cmpuk01ml",
  omiseVersion: "2015-09-10",
});

var admin = require("firebase-admin");
var serviceAccount = require("./firebase/kmitlfitnessapp-firebase-adminsdk-les1k-3fc25aa1d0.json");
var moment = require("moment");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kmitlfitnessapp.firebaseio.com"
});

app.use(cors({ origin: true }));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("KMITL fitness backend.");
});

app.post("/api/payment/charge", (req, res) => {
  console.log("api-payment-charge-call");
  console.log(req.body);
  var omise = require("omise")({
    secretKey: "skey_test_5jidn0btt7cmpuk01ml",
    omiseVersion: "2015-09-10",
  });
  omise.charges
    .create({
      description: "Charge for order ID:888",
      amount: req.body.amount + "", // 1,000 Baht
      currency: "thb",
      capture: true,
      card: req.body.omiseToken,
    })
    .then(async function (charge) {
      if (charge.status == "successful") {
        console.log("paid success");
        const snapshotPackage = await admin.firestore().collection('package').doc(req.body.packageId).get();
        //console.log(snapshotPackage.data().totalDay);
        const snapshotUserdata = await admin.firestore().collection('userdata').doc(req.body.userId).get();
       // console.log(snapshotUserdata.data().membershipExpireDate);
        var newMembershipExpireDate = moment(Date.now()).add(snapshotPackage.data().totalDay,'days');
        console.log('new Date : ')
        console.log(newMembershipExpireDate.format('DD-MM-YYYY'));
        await admin.firestore().collection('userdata').doc(req.body.userId).update({membershipExpireDate:newMembershipExpireDate}); 
        await admin.firestore().collection('income').add({
          time:admin.firestore.FieldValue.serverTimestamp(),
          user:snapshotUserdata.id,
          value:snapshotPackage.data().price,
          packageId:snapshotPackage.id,
        });
        res.redirect(
          "https://kmitlfitnessapp.web.app/payment_result?message=payment+success."
        );
      } else {
        console.log("paid failed");
        res.redirect(
          "https://kmitlfitnessapp.web.app/payment_result?message=payment+failed."
        );
      }
    })
    .error(function (err) {
      console.log("paid failed");
      res.redirect(
        "https://kmitlfitnessapp.web.app/payment_result?message=payment+failed."
      );
    })
    .done();
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Start licening on port" + process.env.PORT + "or" + 3000);
});
