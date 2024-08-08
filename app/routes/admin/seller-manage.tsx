import { LoadingOverlay } from "@mantine/core";
import { useNavigation } from "@remix-run/react";
import { PageLayout } from "~/components/page_layout";

export default function Page() {
  const navigation = useNavigation();
  return (
    <>
      <LoadingOverlay visible={navigation.state == "loading"} overlayBlur={2} />
      <PageLayout>Hello</PageLayout>
    </>
  );
}
