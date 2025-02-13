import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "./../store/appContext";
import logoLetras from "../../img/logo_letras.png";

export const Navbar = () => {
    const { store, actions } = useContext(Context);
    const { isLoggedIn } = store;
	const navigate = useNavigate();

    const handleLogout = () => {
        actions.logout();
		navigate("/");
    };

    return (
        <nav className="navbar navbar-light" style={{ backgroundColor: "#67ABB8" }}>
            <div className="container">
                <Link to="/">
                    <img className="logo-letras-navbar" src={logoLetras} alt="Website Logo" style={{ width: "40%" }} />
                </Link>
                <div className="ml-auto">
                    {isLoggedIn ? (
                        <>
                            <button className="logout-button btn btn-secondary" style={{ backgroundColor: " #F15B40" }} onClick={handleLogout}>
                                Logout
                            </button>
                            <Link to="/profile">
                                <img
                                    src="https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Dog-512.png"
                                    alt="Profile"
                                    className="rounded-circle border border-black border-2 ms-4"
                                    style={{
                                        width: "50px",
                                        height: "50px",
                                        objectFit: "cover",
                                    }}
                                />
                            </Link>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#loginModal">Login</button>
                            <button className="btn btn-secondary ms-2" data-bs-toggle="modal" data-bs-target="#registroModal">Signup</button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};