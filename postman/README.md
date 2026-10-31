# Postman testing

1. Open Postman and **Import** these files:
   - `FitCloud.postman_collection.json`
   - `FitCloud-Local.postman_environment.json` (and `FitCloud-AWS.postman_environment.json` after deployment)
2. Select the **FitCloud Local** environment (top right). Start the backend (`npm run dev`).
3. Run folder **1. Auth > Register** first. It saves `{{token}}` automatically and every other request uses it.
4. Run the folders in order, or use **Run collection** to execute everything with the built-in test scripts.

Each request has `pm.test` checks (status codes, token returned, worker-thread header, and so on).
Folder **8. Negative tests** covers: no token (401), invalid token (401), invalid data (400), non-existing resource (404), invalid ID (400), wrong password (401), duplicate email (409).

To test the profile picture upload, open **Register** or **Update Profile**, tick the `profileImage` row in the Body, and choose a JPG/PNG/WEBP up to 2 MB (needs AWS S3 configured in `backend/.env`).
