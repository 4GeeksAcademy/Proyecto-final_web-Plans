import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./component/scrollToTop";
import { BackendURL } from "./component/backendURL";

import { Home } from "./pages/home";
import { LogedHome } from "./pages/logedHome";
import { Demo } from "./pages/demo";
import { Single } from "./pages/single";
import injectContext from "./store/appContext";
import { Profile } from "./pages/profile";
import { PlansHistory } from "./pages/plansHistory";
import { ActivePlans } from "./pages/activePlans";
import NewPlan from './pages/newPlan';
import JoinPlan from './pages/joinPlan';

import { Navbar } from "./component/navbar";
import { Footer } from "./component/footer";

// Create your first component
const Layout = () => {
    // The basename is used when your project is published in a subdirectory and not in the root of the domain
    // You can set the basename on the .env file located at the root of this project, E.g: BASENAME=/react-hello-webapp/
    const basename = process.env.BASENAME || "";

    // Check if the backend URL is set
    if (!process.env.BACKEND_URL || process.env.BACKEND_URL == "") return <BackendURL />;

    // State to manage the token
    const [token, setToken] = useState(localStorage.getItem("token"));

    // Effect to update the token when localStorage changes
    useEffect(() => {
        const updateToken = () => {
            const newToken = localStorage.getItem("token");
            console.log("Token updated:", newToken); // Depuración
            setToken(newToken);
        };

        window.addEventListener("storage", updateToken);

        return () => {
            window.removeEventListener("storage", updateToken);
        };
    }, []);

    // Render the layout based on whether the user is logged in (has a token)
    return (
        <div>
            <BrowserRouter basename={basename}>
                <ScrollToTop>
                    <Navbar />
                    <Routes>
                        {/* Common routes for all users */}
                        <Route element={<Home />} path="/" />
                        <Route element={<Demo />} path="/demo" />
                        <Route element={<Single />} path="/single/:theid" />
                        <Route path="/new-plan" element={<NewPlan />} />
                        <Route element={<Profile />} path="/profile" />
                        <Route path="*" element={<h1>Not found!</h1>} />

                        {/* Routes for logged-in users */}
                        {token && (
                            <>
                                <Route element={<LogedHome />} path="/loged-home" />
                                
                                <Route path="/plans-history" element={<PlansHistory />} />
                                <Route path="/active-plans" element={<ActivePlans />} />
                                <Route path="/join-plan" element={<JoinPlan />} />
                            </>
                        )}
                    </Routes>
                    <Footer />
                </ScrollToTop>
            </BrowserRouter>
        </div>
    );
};

export default injectContext(Layout);