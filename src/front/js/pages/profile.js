import React, { useContext, useEffect, useState, useRef } from "react";
import { Context } from "../store/appContext";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/home.css";
import "../../styles/profile.css";

export const Profile = () => {
  const { store, actions } = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();

  const [profileImage, setProfileImage] = useState("https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Dog-512.png");
  const [backgroundImage, setBackgroundImage] = useState("https://plus.unsplash.com/premium_photo-1685082778336-282f52a3a923?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Zm9uZG8lMjBkZSUyMHBhbnRhbGxhJTIwZGElMjBjb2xvcmVzfGVufDB8fDB8fHww");

  const profileFileInputRef = useRef(null);
  const backgroundFileInputRef = useRef(null);

  const handleProfileImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setBackgroundImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundButtonClick = () => {
    backgroundFileInputRef.current.click();
  };

  const handleProfileButtonClick = () => {
    profileFileInputRef.current.click();
  };

  const handleAccountClick = () => {
    navigate("/profile");
  };

  const handleActivePlansClick = () => {
    navigate("/active-plans");
  };

  const handleHistoryClick = () => {
    navigate("/plans-history");
  };

  useEffect(() => {
    console.log("Profile component mounted");
    document.title = "Profile";

    const token = store.token || localStorage.getItem('token');
    if (!token) {
      console.log("No token found, redirecting to login...");
      navigate('/');
    }
  }, [store.token, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    description: "",
    interests: "",
  });

  const [isEditing, setIsEditing] = useState({
    name: false,
    email: false,
    phone: false,
    address: false,
    dob: false,
    description: false,
    interests: false,
  });

  useEffect(() => {
    if (store.user) {
      setFormData({
        name: store.user.name,
        email: store.user.email,
        phone: store.user.phone,
        address: store.user.address,
        dob: store.user.dob,
        description: store.user.description,
        interests: store.user.interests,
      });
    } else {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser) {
        setFormData({
          name: storedUser.name,
          email: storedUser.email,
          phone: storedUser.phone,
          address: storedUser.address,
          dob: storedUser.dob,
          description: storedUser.description,
          interests: storedUser.interests,
        });
      }
    }
  }, [store.user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const toggleEdit = (field) => {
    setIsEditing((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSaveChanges = () => {
    if (!formData.name || !formData.email) {
      alert("Name and email are required.");
      return;
    }
    actions.saveProfile(formData);
    navigate("/home");
  };

  return (
    <div className="container mt-4">
      <div
        id="profileBackground"
        className="mb-3 position-relative"
        style={{
          height: "300px",
          backgroundColor: "#ccc",
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      >
        <button
          onClick={handleBackgroundButtonClick}
          className="btnProfile position-absolute"
          style={{
            bottom: "10px",
            right: "10px",
            padding: "10px",
            borderRadius: "50%",
            zIndex: 10,
          }}
        >
          <i className="fa-solid fa-camera-retro"></i>
        </button>
      </div>

      <div className="d-flex justify-content-center mb-4">
        <div className="position-relative">
          {!profileImage ? (
            <div
              className="rounded-circle"
              style={{
                width: "150px",
                height: "150px",
                backgroundColor: "#e9ecef",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "30px",
                color: "#6c757d",
              }}
            ></div>
          ) : (
            <img
              src={profileImage}
              alt="Profile"
              className="rounded-circle border border-black border-5"
              style={{
                width: "150px",
                height: "150px",
                objectFit: "cover",
              }}
            />
          )}

          <button
            onClick={handleProfileButtonClick}
            className="btnProfile position-absolute"
            style={{
              bottom: "0px",
              right: "0px",
              padding: "5px 10px",
              borderRadius: "50%",
              zIndex: 10,
            }}
          >
            <i className="fa-solid fa-camera-retro"></i>
          </button>
        </div>
      </div>

      <div className="text-center mb-4">
        <h4>{formData.name || "User Name"}</h4>
      </div>

      <hr className="my-4" />

      <div className="row text-center mb-4">
        <div className="col">
          <button onClick={handleAccountClick} className="btnProfile w-100">
            Account
          </button>
        </div>
        <div className="col">
          <button onClick={handleActivePlansClick} className="btnProfile w-100">
            Active plans
          </button>
        </div>
        <div className="col">
          <button onClick={handleHistoryClick} className="btnProfile w-100">
            History
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={profileFileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleProfileImageChange}
      />

      <input
        type="file"
        ref={backgroundFileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleBackgroundImageChange}
      />

      <h4 className="text-center mb-4">Edit Profile</h4>

      <div style={{ backgroundColor: "#67ABB8", padding: "20px", borderRadius: "10px" }}>
        <form className="mt-4">
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing.name}
                placeholder="Your name"
              />
              <span
                className="input-group-text"
                onClick={() => toggleEdit("name")}
                style={{ cursor: "pointer" }}
              >
                <i className="fa-solid fa-pencil"></i>
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <div className="input-group">
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing.email}
                placeholder="Your email"
              />
              <span
                className="input-group-text"
                onClick={() => toggleEdit("email")}
                style={{ cursor: "pointer" }}
              >
                <i className="fa-solid fa-pencil"></i>
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="phone" className="form-label">
              Phone
            </label>
            <div className="input-group">
              <input
                type="tel"
                className="form-control"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing.phone}
                placeholder="Your phone number"
              />
              <span
                className="input-group-text"
                onClick={() => toggleEdit("phone")}
                style={{ cursor: "pointer" }}
              >
                <i className="fa-solid fa-pencil"></i>
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing.address}
                placeholder="Your address"
              />
              <span
                className="input-group-text"
                onClick={() => toggleEdit("address")}
                style={{ cursor: "pointer" }}
              >
                <i className="fa-solid fa-pencil"></i>
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="dob" className="form-label">
              Date of Birth
            </label>
            <div className="input-group">
              <input
                type="date"
                className="form-control"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                disabled={!isEditing.dob}
              />
              <span
                className="input-group-text"
                onClick={() => toggleEdit("dob")}
                style={{ cursor: "pointer" }}
              >
                <i className="fa-solid fa-pencil"></i>
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <div className="input-group">
              <textarea
                className="form-control"
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleInputChange}
                disabled={!isEditing.description}
                placeholder="Describe yourself"
              />
              <span
                className="input-group-text"
                onClick={() => toggleEdit("description")}
                style={{ cursor: "pointer" }}
              >
                <i className="fa-solid fa-pencil"></i>
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="interests" className="form-label">
              Interests
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="interests"
                name="interests"
                value={formData.interests}
                onChange={handleInputChange}
                disabled={!isEditing.interests}
                placeholder="Your interests"
              />
              <span
                className="input-group-text"
                onClick={() => toggleEdit("interests")}
                style={{ cursor: "pointer" }}
              >
                <i className="fa-solid fa-pencil"></i>
              </span>
            </div>
          </div>
        </form>
      </div>
      <button type="submit" className="btnProfile w-100 mt-3" onClick={handleSaveChanges}>
        Save Changes
      </button>
    </div>
  );
};