import { Form, Outlet, useLoaderData } from "@remix-run/react";
import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import authenticator from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";
import styled from "styled-components";
import { AdminHeader } from "~/components/header";

const AdminPage = styled.div`
  width: inherit;
  font-size: 33px;
  text-align: center;
  font-weight: 700;
  line-height: 1;
`;

export default function Admin() {
    return <AdminPage>
        <AdminHeader />
        <Outlet />
    </AdminPage>
}