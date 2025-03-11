<template>
    <RouterView />
    <footer>
        <div class="footer-content">
            <div class="title">
                <RouterLink to="/">🌸 aurabloom</RouterLink>
                <p>free & open source chat</p>
            </div>
            <div class="links">
                <RouterLink to="/">home</RouterLink>
                <RouterLink to="/privacy">privacy</RouterLink>
            </div>
        </div>
    </footer>
</template>

<style lang="scss" scoped>
footer {
    width: 100%;
    padding: 2rem 1rem;
    background-color: hsl(var(--crust));
    border-top: 1px solid hsla(var(--subtext0) / 0.2);

    .footer-content {
        max-width: 1024px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;

        @media (max-width: 768px) {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
        }

        .title {
            a {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 900;
                color: hsl(var(--text));
                display: flex;
                align-items: center;
                gap: 0.5rem;
                text-decoration: none;
            }

            p {
                margin: 0.25rem 0 0;
                color: hsl(var(--subtext1));
                font-size: 0.9rem;
            }
        }

        .links {
            display: flex;
            gap: 1.5rem;

            a {
                color: hsl(var(--subtext0));
                text-decoration: none;
                transition: all 0.2s ease;
                position: relative;

                &:after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 2px;
                    bottom: -4px;
                    left: 0;
                    background-color: hsl(var(--accent));
                    transition: width 0.2s ease;
                }

                &:hover {
                    color: hsl(var(--accent));
                    &:after {
                        width: 100%;
                    }
                }
            }
        }
    }

    a {
        color: hsl(var(--subtext0));
        text-decoration: none;
        transition: all 0.2s ease;
        position: relative;

        &:after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: -4px;
            left: 0;
            background-color: hsl(var(--accent));
            transition: width 0.2s ease;
        }

        &:hover {
            color: hsl(var(--accent));
            &:after {
                width: 100%;
            }
        }
    }
}
</style>
