import React, { memo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { events$, posts$ } from "../../redux/selectors";

import { getPostDetail } from "../../redux/actions/posts";
import ListPosts from "./ListPosts";
import axios from "axios";
import { apiURL } from "../../api";
import MoreListEvent from "../events/MoreListEvent";
import { getEvents } from "../../redux/actions/events";
import Swal from "sweetalert2";
import moment from "moment";

const PostDetail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const posts = useSelector(posts$);
    const events = useSelector(events$);

    const [listPost, setListPost] = useState();

    useEffect(() => {
        dispatch(getPostDetail.getPostDetailRequest(id));
        dispatch(getEvents.getEventsRequest());
        getListPost();
    }, [id]);
    const getListPost = async () => {
        try {
            const resPost = await axios.post(`${apiURL}/posts/${id}`, {
                select: { event: { select: { posts: true } } },
            });
            if (resPost?.data?.data?.event) {
                setListPost(resPost?.data?.data?.event?.posts);
            }
        } catch (error) {}
    };

    const previewImg = (e) => {
        console.log(e.target.src);
        Swal.fire({
            imageUrl: e.target.src,
            imageWidth: 500,
            showConfirmButton: false,
        });
    };

    const lstString = posts.singlePostDetail?.description.split("\n");

    console.log(posts);

    return (
        <>
            {moment(posts?.singlePostDetail?.event?.expiredAt).isAfter() && (
                <Link
                    to={`/money-donation/${posts.singlePostDetail?.eventId}`}
                    type="button"
                    className="btn btn-custom-mirror btn-donation"
                >
                    Quyên Góp
                </Link>
            )}
            {/* Page Header Start */}
            <div className="page-header" style={{ padding: "150px 0px 20px" }}>
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <h2>HELPZ</h2>
                        </div>
                        <div className="col-12">
                            <a>Give Is Receive</a>
                        </div>
                    </div>
                </div>
            </div>
            {/* Page Header End */}
            <div className="single">
                <div className="container" style={{ maxWidth: "90vw" }}>
                    <div className="row">
                        <div className="col-lg-8">
                            <div className="single-content">
                                <img
                                    src={
                                        posts.singlePostDetail?.thumbnail?.url ?? "/img/charity.png"
                                    }
                                    style={{ maxHeight: "700px", objectFit: "cover" }}
                                    onClick={(e) => previewImg(e)}
                                />
                                <h2
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        textAlign: "left",
                                    }}
                                >
                                    {posts.singlePostDetail?.title}
                                </h2>
                                <h6 style={{ marginLeft: 15, marginTop: 15 }}>
                                    {" Ngày: "}
                                    {posts?.singlePostDetail?.createdAt &&
                                        new Intl.DateTimeFormat(["ban", "id"], {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",

                                            hour12: true,
                                            hour: "numeric",
                                            minute: "numeric",
                                        })
                                            .format(new Date(posts?.singlePostDetail?.createdAt))
                                            .replace(".", ":")}
                                </h6>
                                <hr></hr>
                                {lstString?.length &&
                                    lstString.map((item) => (
                                        <p style={{ marginBottom: 7, textAlign: "justify" }}>
                                            &emsp;&emsp; {item}
                                        </p>
                                    ))}
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="sidebar">
                                <div className="sidebar-widget">
                                    <ListPosts
                                        posts={listPost?.filter((p) => p.id != id)}
                                        title={"Bài Viết Khác"}
                                    />
                                </div>

                                <div className="sidebar-widget">
                                    <MoreListEvent
                                        events={events?.data?.items?.filter(
                                            (p) => p.id != posts?.singlePostDetail?.eventId,
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PostDetail;
