const getState = ({ getStore, getActions, setStore }) => {
    return {
        store: {
            message: null,
            token: null,
            isLoggedIn: false,
            demo: [
                {
                    title: "FIRST",
                    background: "white",
                    initial: "white"
                },
                {
                    title: "SECOND",
                    background: "white",
                    initial: "white"
                }
            ]
        },
        actions: {
            exampleFunction: () => {
                getActions().changeColor(0, "green");
            },

            getMessage: async () => {
                try {
                    const resp = await fetch(process.env.BACKEND_URL + "/api/hello");
                    const data = await resp.json();
                    setStore({ message: data.message });
                    return data;
                } catch (error) {
                    console.log("Error loading message from backend", error);
                }
            },

            changeColor: (index, color) => {
                const store = getStore();
                const demo = store.demo.map((elm, i) => {
                    if (i === index) elm.background = color;
                    return elm;
                });
                setStore({ demo: demo });
            },

            signup: async (name, email, password) => {
                try {
                    const resp = await fetch(process.env.BACKEND_URL + "/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password, name }),
                    });
                    if (!resp.ok) throw new Error("Error en el registro");

                    const data = await resp.json();
                    localStorage.setItem("token", data.token);
                    setStore({ token: data.token, isLoggedIn: true });
                } catch (error) {
                    console.error("Error en el registro:", error);
                    throw error;
                }
            },

            login: async (email, password) => {
                try {
                    const resp = await fetch(process.env.BACKEND_URL + "/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password }),
                    });
                    if (!resp.ok) throw new Error("Login fallido");

                    const data = await resp.json();
                    localStorage.setItem("token", data.token);
                    setStore({ token: data.token, isLoggedIn: true });
                } catch (error) {
                    console.error("Error en el login:", error);
                    throw error;
                }
            },

            logout: () => {
                localStorage.removeItem("token");
                setStore({ token: null, isLoggedIn: false });
            },

            private: async () => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) return false;

                    const resp = await fetch(process.env.BACKEND_URL + "/private", {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token,
                        },
                    });
                    if (!resp.ok) return false;

                    const data = await resp.json();
                    return true;
                } catch (error) {
                    console.error("Error validando token:", error);
                    return false;
                }
            },

            getCategories: async () => {
                try {
                    const resp = await fetch(process.env.BACKEND_URL + "/categories", {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });
                    if (!resp.ok) {
                        throw new Error(`Error ${resp.status}: ${resp.statusText}`);
                    }

                    const data = await resp.json();
                    setStore({ categories: data });
                } catch (error) {
                    console.error("Error al obtener categorías:", error);
                }
            },

            createPlan: async (planData) => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) {
                        throw new Error("No hay token de autenticación. Por favor, inicia sesión.");
                    }

                    const resp = await fetch(process.env.BACKEND_URL + "/plans", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token,
                        },
                        body: JSON.stringify(planData),
                    });
                    if (!resp.ok) {
                        const errorData = await resp.json();
                        throw new Error(errorData.message || "Error al crear el plan");
                    }

                    const data = await resp.json();
                    return data;
                } catch (error) {
                    console.error("Error al crear el plan:", error.message);
                    throw error;
                }
            },
        },
    };
};

export default getState;