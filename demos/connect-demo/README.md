# LNC Demo - Basic Connect

This demo showcases the most basic flow to connect from a browser to a Lightning Terminal
(litd) node using the `lnc-web` NPM package.

## Running the demo

To run the demo, you'll need to have NodeJS installed and a Lightning Terminal node
accessible that you can obtain a pairing phrase from.

1. Clone this repo
   ```sh
   $ git clone https://github.com/lightninglabs/lnc-web.git
   $ cd lnc-web/demos/connect-demo
   ```
2. Install the dependencies
   ```sh
   $ npm install
   ```
3. Start the web app
   ```sh
   $ npm start
   ```
   Your browser should open to http://localhost:3000 and you should see the home page
   below

## Screenshots

### Welcome page with Connect button

![1_welcome](./public/img/1_welcome.png)

### Connect page

Enter your pairing phrase and a new password to use so you don't need to login again

![2_connect](./public/img/2_connect.png)

### Welcome page when connected

After connecting to your node, you'll be redirected back to the welcome page, but now it
will display some information obtained from calling `GetInfo` on `lnd`.

![3_connected](./public/img/3_connected.png)

### Login page

If you reload the page or click the Logout link, you will be taken back to the Welcome
page. It will detect that you have already connected from this browser in the past and
display a "Login" button instead of "Connect". When you click "Login", you'll be take to
the Login page where you only need to provide your password to reconnect to your node.

![4_login](./public/img/4_login.png)
